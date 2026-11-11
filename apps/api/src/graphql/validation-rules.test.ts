import { buildSchema, parse, validate } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { describe, expect, it } from 'vitest';
import { complexityRule, MAX_QUERY_DEPTH } from './validation-rules.js';

const recursiveSchema = buildSchema(`
  type Query {
    node: Node
  }

  type Node {
    child: Node
  }
`);

describe('validation rules', () => {
  it('rejects queries deeper than the configured limit', () => {
    const document = parse(`
      query Deep {
        node {
          child {
            child {
              child {
                child {
                  child {
                    child {
                      child {
                        child {
                          child {
                            child {
                              child {
                                child
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const errors = validate(recursiveSchema, document, [depthLimit(MAX_QUERY_DEPTH)]);

    expect(errors[0]?.message).toContain('exceeds maximum operation depth');
  });

  it('rejects queries above the configured complexity', () => {
    const schema = buildSchema(`
      type Query {
        contacts(first: Int): ContactConnection
      }

      type ContactConnection {
        edges: [ContactEdge!]!
      }

      type ContactEdge {
        node: Contact!
      }

      type Contact {
        id: ID!
      }
    `);

    const aliases = Array.from(
      { length: 10 },
      (_, index) => `c${index}: contacts(first: 100) { edges { node { id } } }`,
    ).join('\n');
    const document = parse(`query { ${aliases} }`);

    const errors = validate(schema, document, [complexityRule]);

    expect(errors[0]?.message).toContain('complexidade');
  });
});
