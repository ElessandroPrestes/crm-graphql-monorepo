import { describe, expect, it } from 'vitest';
import {
  formatCurrencyFromCents,
  formatDate,
  formatDateTime,
  formatNumber,
  translate,
} from './messages';

describe('i18n messages', () => {
  it('interpolates parameters in pt-BR messages', () => {
    expect(translate('inbox.openConversation', { name: 'Ana Silva' })).toBe(
      'Abrir conversa com Ana Silva',
    );
    expect(translate('conversation.newMessage', { name: 'Ana' })).toBe('Nova mensagem de Ana.');
  });

  it('formats currency, numbers and dates for the Brazilian locale', () => {
    expect(formatCurrencyFromCents(150000)).toContain('R$');
    expect(formatCurrencyFromCents(150000)).toContain('1.500,00');
    expect(formatNumber(1200)).toBe('1.200');
    expect(formatDate('2026-05-04T12:00:00.000Z')).toContain('2026');
    expect(formatDateTime('2026-05-04T12:00:00.000Z')).toContain('09:00');
  });
});
