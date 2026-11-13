import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`);

export function assertPasswordPolicy(password: string): string {
  const result = passwordSchema.safeParse(password);

  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => issue.message).join('; '));
  }

  return result.data;
}
