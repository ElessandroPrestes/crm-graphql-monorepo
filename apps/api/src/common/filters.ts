import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export const MAX_SEARCH_LENGTH = 100;

export function normalizeSearch(value?: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  if (trimmed.length > MAX_SEARCH_LENGTH) {
    throw new BadRequestException(`Busca não pode exceder ${MAX_SEARCH_LENGTH} caracteres`);
  }

  return trimmed;
}

export function optionalUuid(value: string | undefined, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = z.string().uuid().safeParse(value);

  if (!parsed.success) {
    throw new BadRequestException(`${field} inválido`);
  }

  return parsed.data;
}
