import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { baseEnvSchema, originsSchema, parseEnv, portSchema } from './env.js';

describe('parseEnv', () => {
  it('applies local development defaults', () => {
    const env = parseEnv(baseEnvSchema, {});

    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toContain('localhost:5402');
    expect(env.REDIS_URL).toContain('localhost:8203');
    expect(env.RABBITMQ_URL).toContain('localhost:8204');
  });

  it('keeps explicit values', () => {
    const env = parseEnv(baseEnvSchema, {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:pass@db:5432/nexo',
    });

    expect(env.NODE_ENV).toBe('test');
    expect(env.DATABASE_URL).toBe('postgresql://user:pass@db:5432/nexo');
  });

  it('rejects out-of-range ports with a useful path', () => {
    const schema = z.object({ API_PORT: portSchema(3202) });

    expect(() => parseEnv(schema, { API_PORT: '70000' })).toThrow(/API_PORT/);
  });

  it('splits and trims CORS origins', () => {
    const schema = z.object({ CORS_ORIGINS: originsSchema('http://localhost:5217') });
    const env = parseEnv(schema, {
      CORS_ORIGINS: 'http://localhost:5217, http://nexo.localhost',
    });

    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5217', 'http://nexo.localhost']);
  });
});
