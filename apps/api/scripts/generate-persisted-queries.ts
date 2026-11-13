import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Kind, print, visit, type DocumentNode } from 'graphql';
import * as operations from '@nexo/graphql-schema/operations';

const TYPENAME_FIELD = {
  kind: Kind.FIELD,
  name: { kind: Kind.NAME, value: '__typename' },
} as const;

function addTypenameToDocument(document: DocumentNode): DocumentNode {
  return visit(document, {
    SelectionSet: {
      enter(node, _key, parent) {
        if (parent && parent.kind === Kind.OPERATION_DEFINITION) {
          return;
        }

        const selections = node.selections;

        if (!selections) {
          return;
        }

        const skip = selections.some(
          (selection) =>
            selection.kind === Kind.FIELD &&
            (selection.name.value === '__typename' ||
              selection.name.value.lastIndexOf('__', 0) === 0),
        );

        if (skip) {
          return;
        }

        const field = parent as {
          kind?: string;
          directives?: readonly { name: { value: string } }[];
        };

        if (
          field.kind === Kind.FIELD &&
          field.directives?.some((directive) => directive.name.value === 'export')
        ) {
          return;
        }

        return {
          ...node,
          selections: [...selections, TYPENAME_FIELD],
        };
      },
    },
  });
}

function operationName(document: DocumentNode): string {
  const definition = document.definitions.find((item) => item.kind === Kind.OPERATION_DEFINITION);

  if (!definition || definition.kind !== Kind.OPERATION_DEFINITION) {
    return 'Anonymous';
  }

  return definition.name?.value ?? 'Anonymous';
}

function hash(query: string): string {
  return createHash('sha256').update(query).digest('hex');
}

function isOperation(value: unknown): value is DocumentNode {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { kind?: string; definitions?: readonly { kind?: string }[] };

  return (
    candidate.kind === Kind.DOCUMENT &&
    Array.isArray(candidate.definitions) &&
    candidate.definitions.some((definition) => definition.kind === Kind.OPERATION_DEFINITION)
  );
}

function generate(): void {
  const entries: Record<string, { name: string; query: string }> = {};

  for (const document of Object.values(operations)) {
    if (!isOperation(document)) {
      continue;
    }

    const name = operationName(document);
    const variants = [print(document), print(addTypenameToDocument(document))];

    for (const query of variants) {
      const sha256Hash = hash(query);

      entries[sha256Hash] = { name, query };
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)),
  );

  const content = `// Gerado por scripts/generate-persisted-queries.ts. Não edite manualmente.\nexport interface PersistedQueryEntry {\n  name: string;\n  query: string;\n}\n\nexport const PERSISTED_QUERIES: Record<string, PersistedQueryEntry> = ${JSON.stringify(sorted, null, 2)};\n`;

  const output = fileURLToPath(
    new URL('../src/graphql/persisted-queries.generated.ts', import.meta.url),
  );

  writeFileSync(output, content, 'utf8');
}

generate();
