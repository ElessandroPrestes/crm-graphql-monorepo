import { baseEnvSchema, originsSchema, parseEnv, portSchema } from '@nexo/shared';
import type { z } from 'zod';

export const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: portSchema(3202),
  CORS_ORIGINS: originsSchema('http://localhost:5217'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function validateApiEnv(input: Record<string, unknown>): ApiEnv {
  return parseEnv(apiEnvSchema, input);
}
