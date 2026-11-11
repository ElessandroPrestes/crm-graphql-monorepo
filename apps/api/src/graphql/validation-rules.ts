import {
  GraphQLError,
  Kind,
  type ASTVisitor,
  type FieldNode,
  type ValidationContext,
  type ValidationRule,
} from 'graphql';
import { DEFAULT_PAGE_SIZE } from '../common/pagination.js';

export const MAX_QUERY_DEPTH = 10;
export const MAX_QUERY_COMPLEXITY = 1000;
export const MAX_QUERY_ALIASES = 10;

const LIST_FIELDS = new Set(['contacts', 'companies', 'deals', 'activities']);

function fieldCost(node: FieldNode): number {
  if (LIST_FIELDS.has(node.name.value)) {
    const firstArgument = node.arguments?.find((argument) => argument.name.value === 'first');

    if (firstArgument?.value.kind === Kind.INT) {
      return 1 + Number(firstArgument.value.value);
    }

    return 1 + DEFAULT_PAGE_SIZE;
  }

  return 1;
}

export function createComplexityLimitRule(maxComplexity: number): ValidationRule {
  return (context: ValidationContext): ASTVisitor => {
    let complexity = 0;

    return {
      Field(node) {
        complexity += fieldCost(node);

        if (complexity > maxComplexity) {
          context.reportError(
            new GraphQLError(`Limite de complexidade de ${maxComplexity} excedido.`, {
              nodes: node,
            }),
          );
        }
      },
    };
  };
}

export const complexityRule = createComplexityLimitRule(MAX_QUERY_COMPLEXITY);

export function createAliasLimitRule(maxAliases: number): ValidationRule {
  return (context: ValidationContext): ASTVisitor => {
    let aliases = 0;

    return {
      Field(node) {
        if (!node.alias) {
          return;
        }

        aliases += 1;

        if (aliases > maxAliases) {
          context.reportError(
            new GraphQLError(`Limite de ${maxAliases} aliases excedido.`, {
              nodes: node,
            }),
          );
        }
      },
    };
  };
}
