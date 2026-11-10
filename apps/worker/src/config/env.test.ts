import { describe, expect, it } from 'vitest';
import { validateWorkerEnv } from './env.js';

describe('validateWorkerEnv', () => {
  it('applies the worker defaults', () => {
    const env = validateWorkerEnv({});

    expect(env.WORKER_PORT).toBe(3203);
    expect(env.NODE_ENV).toBe('development');
  });

  it('rejects an invalid port', () => {
    expect(() => validateWorkerEnv({ WORKER_PORT: 'not-a-port' })).toThrow(/WORKER_PORT/);
  });
});
