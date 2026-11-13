import { describe, expect, it } from 'vitest';
import { stripFieldSuggestions } from './graphql.module.js';

describe('stripFieldSuggestions', () => {
  it('remove sugestões de campo de erros de validação', () => {
    const message = 'Cannot query field "nome" on type "User". Did you mean "name"?';

    expect(stripFieldSuggestions(message)).toBe('Cannot query field "nome" on type "User".');
  });

  it('preserva mensagens sem sugestão', () => {
    expect(stripFieldSuggestions('Syntax Error: Expected Name, found "}"')).toBe(
      'Syntax Error: Expected Name, found "}"',
    );
  });
});
