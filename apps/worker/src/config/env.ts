import { baseEnvSchema, parseEnv, portSchema } from '@nexo/shared';
import { z } from 'zod';

export const workerEnvSchema = baseEnvSchema.extend({
  WORKER_PORT: portSchema(3203),
  WORKER_PREFETCH: z.coerce.number().int().min(1).max(100).default(10),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function validateWorkerEnv(input: Record<string, unknown>): WorkerEnv {
  return parseEnv(workerEnvSchema, input);
}
