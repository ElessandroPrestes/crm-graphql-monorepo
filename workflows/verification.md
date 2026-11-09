# QA-Verifier workflow

## Purpose

QA-Verifier is the mandatory comparison step between QA and Code Review. It
tests traceability, not product behavior: it compares the approved structured
acceptance-criterion contract to the structured QA-evidence contract. It never
marks an inferred or prose-only result as passing.

## Inputs

- the approved SPEC, using the YAML criterion fields `id`, `preconditions`,
  `action`, `expected_result`, and `evidence_type`;
- the assigned TASK and its criterion references;
- structured QA evidence with one result for each criterion ID, as defined by
  the QA-evidence contract;
- authorized exceptions, if any.

Structured QA evidence must follow `templates/QA_EVIDENCE_TEMPLATE.md`.
QA-Verifier produces its verification report using `templates/VERIFICATION_REPORT_TEMPLATE.md`.
With this contract in place, QA-Verifier is operational and issues passing results
when all applicable criteria are verified without open findings.

## Comparison

For every applicable SPEC criterion, QA-Verifier verifies that:

1. the criterion ID appears exactly once in QA evidence;
2. the evidence result is passing or has an authorized exception;
3. the evidence identifies how the preconditions, action, and expected result
   were verified; and
4. no QA-evidence criterion refers to an unknown or superseded SPEC criterion.

## Output

Produce a reproducible verification report based on
`templates/VERIFICATION_REPORT_TEMPLATE.md` containing the SPEC and TASK
references, evidence locations, execution context, timestamp, and one entry per
criterion. Classify every unresolved item as one of:

- **missing:** no QA evidence exists for an applicable criterion;
- **unmapped:** evidence cannot be linked exactly to one criterion ID;
- **failed:** linked evidence records a failed result;
- **ambiguous:** the criterion or evidence lacks enough structured detail to
  establish the required verification.

## Gate and handoff

QA-Verifier runs after QA evidence is collected and before Code Review. Any
missing, unmapped, failed, or ambiguous item is a blocking Gate 3 finding. The
QA Agent returns those findings to implementation, QA, or the SPEC-amendment
protocol as appropriate. Only a report with no applicable open finding, or an
authorized exception recorded under `standards/quality-gates.md`, permits Code
Review to begin.
