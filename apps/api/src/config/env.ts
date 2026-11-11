import { baseEnvSchema, originsSchema, parseEnv, portSchema } from '@nexo/shared';
import { z } from 'zod';

const DEV_ACCESS_TOKEN_SECRET = 'dev-only-access-token-secret-change-me';
const DEV_WHATSAPP_VERIFY_TOKEN = 'dev-only-whatsapp-verify-token';
const DEV_WHATSAPP_APP_SECRET = 'dev-only-whatsapp-app-secret';

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
    WHATSAPP_PROVIDER: z.enum(['mock', 'cloud']).default('mock'),
    WHATSAPP_VERIFY_TOKEN: z.string().min(16).default(DEV_WHATSAPP_VERIFY_TOKEN),
    WHATSAPP_APP_SECRET: z.string().min(16).default(DEV_WHATSAPP_APP_SECRET),
    WHATSAPP_ACCESS_TOKEN: z.string().min(16).optional(),
    WHATSAPP_API_BASE_URL: z.string().url().default('https://graph.facebook.com'),
    WHATSAPP_API_VERSION: z
      .string()
      .regex(/^v\d+\.\d+$/, 'WHATSAPP_API_VERSION deve seguir o formato vNN.N')
      .default('v23.0'),
    WHATSAPP_SEND_TIMEOUT_MS: z.coerce.number().int().positive().max(60_000).default(10_000),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === 'production' && env.ACCESS_TOKEN_SECRET === DEV_ACCESS_TOKEN_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['ACCESS_TOKEN_SECRET'],
        message: 'ACCESS_TOKEN_SECRET deve ser definido em produção',
      });
    }

    if (env.NODE_ENV === 'production' && env.WHATSAPP_PROVIDER !== 'cloud') {
      context.addIssue({
        code: 'custom',
        path: ['WHATSAPP_PROVIDER'],
        message: 'WHATSAPP_PROVIDER deve ser cloud em produção',
      });
    }

    if (env.NODE_ENV === 'production' && env.WHATSAPP_APP_SECRET === DEV_WHATSAPP_APP_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['WHATSAPP_APP_SECRET'],
        message: 'WHATSAPP_APP_SECRET deve ser definido em produção',
      });
    }

    if (env.WHATSAPP_PROVIDER === 'cloud') {
      for (const field of ['WHATSAPP_APP_SECRET', 'WHATSAPP_ACCESS_TOKEN'] as const) {
        if (!env[field]) {
          context.addIssue({
            code: 'custom',
            path: [field],
            message: `${field} é obrigatório com WHATSAPP_PROVIDER=cloud`,
          });
        }
      }
    }
  });

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function validateApiEnv(input: Record<string, unknown>): ApiEnv {
  return parseEnv(apiEnvSchema, input);
}
