import type { DealStage } from '@nexo/graphql-schema/operations';

export interface ContactName {
  firstName: string;
  lastName: string;
}

export function fullName(contact: ContactName): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export function initials(contact: ContactName): string {
  return `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
}

export const OPEN_STAGES: DealStage[] = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];

export const STAGE_ORDER: DealStage[] = [
  'LEAD',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
];

export function parseReaisToCents(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');

  if (normalized.length === 0) {
    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function stageTone(stage: DealStage): 'info' | 'success' | 'danger' {
  if (stage === 'WON') {
    return 'success';
  }

  if (stage === 'LOST') {
    return 'danger';
  }

  return 'info';
}
