import { baseEnvSchema, originsSchema, parseEnv, portSchema } from '@nexo/shared';
import { z } from 'zod';

const DEV_ACCESS_TOKEN_SECRET = 'dev-only-access-token-secret-change-me';

export const apiEnvSchema = baseEnvSchema
  .extend({
    API_PORT: portSchema(3202),
    CORS_ORIGINS: originsSchema('http://localhost:5217'),
    ACCESS_TOKEN_SECRET: z
      .string()
      .min(32, 'ACCESS_TOKEN_SECRET deve ter ao menos 32 caracteres')
      .default(DEV_ACCESS_TOKEN_SECRET),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
    REFRESH_COOKIE_NAME: z.string().min(1).default('nexo_refresh'),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === 'production' && env.ACCESS_TOKEN_SECRET === DEV_ACCESS_TOKEN_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['ACCESS_TOKEN_SECRET'],
        message: 'ACCESS_TOKEN_SECRET deve ser definido em produção',
      });
    }
  });

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function validateApiEnv(input: Record<string, unknown>): ApiEnv {
  return parseEnv(apiEnvSchema, input);
}
