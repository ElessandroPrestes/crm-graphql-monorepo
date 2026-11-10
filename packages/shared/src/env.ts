import { z } from 'zod';

export const nodeEnvSchema = z.enum(['development', 'test', 'production']);

export type NodeEnv = z.infer<typeof nodeEnvSchema>;

export const baseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://nexo:nexo@localhost:5402/nexo?schema=public'),
  REDIS_URL: z.string().min(1).default('redis://localhost:8203'),
  RABBITMQ_URL: z.string().min(1).default('amqp://nexo:nexo@localhost:8204'),
});

export function portSchema(defaultPort: number) {
  return z.coerce.number().int().min(1).max(65535).default(defaultPort);
}

export function originsSchema(defaultOrigins: string) {
  return z
    .string()
    .default(defaultOrigins)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    );
}

export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  input: Record<string, unknown>,
): z.infer<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return result.data;
}
