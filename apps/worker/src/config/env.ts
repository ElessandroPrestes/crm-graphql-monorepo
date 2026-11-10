import { baseEnvSchema, parseEnv, portSchema } from '@nexo/shared';
import type { z } from 'zod';

export const workerEnvSchema = baseEnvSchema.extend({
  WORKER_PORT: portSchema(3203),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function validateWorkerEnv(input: Record<string, unknown>): WorkerEnv {
  return parseEnv(workerEnvSchema, input);
}
