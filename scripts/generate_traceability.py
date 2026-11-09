#!/usr/bin/env python3
"""Generate a reviewable SPEC-to-delivery traceability matrix."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Sequence


SPEC_PATTERN = re.compile(r"\bSPEC-\d{3}(?:-v\d+)?\b")
TASK_PATTERN = re.compile(r"\bTASK-\d{3}-\d{2}\b")
METADATA_ROW = re.compile(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$", re.MULTILINE)


@dataclass(frozen=True)
class Artifact:
    identifier: str
    status: str
    path: Path
    references: tuple[str, ...]


@dataclass(frozen=True)
class Commit:
    sha: str
    subject: str
    references: tuple[str, ...]


@dataclass
class TraceabilityData:
    specs: list[Artifact] = field(default_factory=list)
    tasks: list[Artifact] = field(default_factory=list)
    reviews: list[Artifact] = field(default_factory=list)
    commits: list[Commit] = field(default_factory=list)


def markdown_files(directory: Path) -> Iterable[Path]:
    if not directory.is_dir():
        return []
    return sorted(
        path
        for path in directory.rglob("*.md")
        if path.is_file() and path.name.casefold() != "readme.md"
    )


def metadata_value(content: str, names: Sequence[str]) -> str:
    normalized_names = {name.casefold() for name in names}
    for match in METADATA_ROW.finditer(content):
        if match.group(1).strip().casefold() in normalized_names:
            return match.group(2).strip()
    return "Not recorded"


def first_identifier(pattern: re.Pattern[str], content: str) -> str | None:
    match = pattern.search(content)
    return match.group(0) if match else None


def collect_artifacts(directory: Path, pattern: re.Pattern[str], kind: str) -> list[Artifact]:
    artifacts = []
    for path in markdown_files(directory):
        content = path.read_text(encoding="utf-8")
        identifier = first_identifier(pattern, content)
        if kind == "review":
            identifier = path.name
        if not identifier:
            continue
        references = tuple(sorted(set(SPEC_PATTERN.findall(content) + TASK_PATTERN.findall(content))))
        artifacts.append(
            Artifact(
                identifier=identifier,
                status=metadata_value(content, ("Status", "Estado")),
                path=path,
                references=references,
            )
        )
    return sorted(artifacts, key=lambda artifact: artifact.identifier)


def git_commits(root: Path) -> list[Commit]:
    command = ["git", "-C", str(root), "log", "--format=%H%x1f%s%x1f%b%x1e"]
    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    if completed.returncode != 0:
        message = completed.stderr.strip() or "Git history is unavailable."
        raise RuntimeError(message)

    commits = []
    for record in completed.stdout.split("\x1e"):
        if not record.strip():
            continue
        sha, subject, body = record.split("\x1f", maxsplit=2)
        references = tuple(sorted(set(SPEC_PATTERN.findall(body) + TASK_PATTERN.findall(body))))
        commits.append(Commit(sha=sha, subject=subject, references=references))
    return commits


def collect_data(root: Path) -> TraceabilityData:
    return TraceabilityData(
        specs=collect_artifacts(root / "specs", SPEC_PATTERN, "spec"),
        tasks=collect_artifacts(root / "tasks", TASK_PATTERN, "task"),
        reviews=collect_artifacts(root / "reviews", SPEC_PATTERN, "review"),
        commits=git_commits(root),
    )


def relative_link(root: Path, target: Path, label: str) -> str:
    relative_target = os.path.relpath(target, start=root / "docs")
    return f"[{label}]({Path(relative_target).as_posix()})"


def task_spec_reference(task: Artifact) -> str | None:
    for reference in task.references:
        if SPEC_PATTERN.fullmatch(reference):
            return reference
    return None


def display_artifacts(root: Path, artifacts: Sequence[Artifact]) -> str:
    if not artifacts:
        return "—"
    return "<br>".join(
        f"{relative_link(root, artifact.path, artifact.identifier)} ({artifact.status})"
        for artifact in artifacts
    )


def display_commits(commits: Sequence[Commit]) -> str:
    if not commits:
        return "—"
    return "<br>".join(f"`{commit.sha[:8]}` {commit.subject}" for commit in commits)


def render_matrix(root: Path, data: TraceabilityData) -> str:
    task_by_spec: dict[str, list[Artifact]] = {}
    for task in data.tasks:
        spec_reference = task_spec_reference(task)
        if spec_reference:
            task_by_spec.setdefault(spec_reference, []).append(task)

    lines = [
        "# Matriz de rastreabilidade (Traceability matrix)",
        "",
        "Gerado por `scripts/generate_traceability.py`. Não edite manualmente; execute novamente o gerador após artefatos de origem ou alterações no histórico do Git.",
        "",
        "| SPEC | Status | Tarefas (Tasks) | Commits | QA/revisão |",
        "|---|---|---|---|---|",
    ]
    for spec in data.specs:
        linked_tasks = task_by_spec.get(spec.identifier, [])
        task_ids = {task.identifier for task in linked_tasks}
        linked_commits = [
            commit
            for commit in data.commits
            if spec.identifier in commit.references or bool(task_ids.intersection(commit.references))
        ]
        linked_reviews = [
            review
            for review in data.reviews
            if spec.identifier in review.references or bool(task_ids.intersection(review.references))
        ]
        lines.append(
            "| {spec} | {status} | {tasks} | {commits} | {reviews} |".format(
                spec=relative_link(root, spec.path, spec.identifier),
                status=spec.status,
                tasks=display_artifacts(root, linked_tasks),
                commits=display_commits(linked_commits),
                reviews=display_artifacts(root, linked_reviews),
            )
        )

    lines.extend(["", "## Lacunas de rastreabilidade (Traceability gaps)", ""])
    gaps = []
    spec_ids = {spec.identifier for spec in data.specs}
    for spec in data.specs:
        if not task_by_spec.get(spec.identifier):
            gaps.append(f"- `{spec.identifier}` não possui TASK vinculada.")
    for task in data.tasks:
        spec_reference = task_spec_reference(task)
        if not spec_reference:
            gaps.append(f"- `{task.identifier}` não possui referência de SPEC.")
        elif spec_reference not in spec_ids:
            gaps.append(f"- `{task.identifier}` referencia uma ausente `{spec_reference}`.")
        elif not any(task.identifier in commit.references for commit in data.commits):
            gaps.append(f"- `{task.identifier}` não possui commit com `Task-Ref: {task.identifier}`.")
    for review in data.reviews:
        if not review.references:
            gaps.append(f"- `{review.path.relative_to(root)}` não possui referência de SPEC ou TASK.")

    lines.extend(gaps or ["- Nenhuma detectada nos artefatos verificados."])
    lines.append("")
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    default_root = Path(__file__).resolve().parents[1]
    parser.add_argument("--repo-root", type=Path, default=default_root, help="Repository root to scan.")
    parser.add_argument("--output", type=Path, help="Matrix path; defaults to <repo-root>/docs/traceability-matrix.md.")
    return parser.parse_args()


def main() -> int:
    arguments = parse_args()
    root = arguments.repo_root.resolve()
    output = arguments.output.resolve() if arguments.output else root / "docs" / "traceability-matrix.md"
    try:
        matrix = render_matrix(root, collect_data(root))
    except RuntimeError as error:
        print(f"traceability: {error}")
        return 1
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(matrix, encoding="utf-8")
    print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
