import { describe, expect, it } from 'vitest';
import { assertPasswordPolicy, PASSWORD_MIN_LENGTH } from './password-policy.js';

describe('password policy', () => {
  it('aceita a senha do seed', () => {
    expect(assertPasswordPolicy('NexoDemo!2026')).toBe('NexoDemo!2026');
  });

  it('rejeita senha curta com mensagem acionável', () => {
    expect(() => assertPasswordPolicy('curta')).toThrow(new RegExp(String(PASSWORD_MIN_LENGTH)));
  });

  it('rejeita senha acima do limite', () => {
    expect(() => assertPasswordPolicy('a'.repeat(129))).toThrow(/128/);
  });
});
