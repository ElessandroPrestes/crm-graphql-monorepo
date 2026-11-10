import { describe, expect, it } from 'vitest';
import { validateApiEnv } from './env.js';

describe('validateApiEnv', () => {
  it('applies the API defaults', () => {
    const env = validateApiEnv({});

    expect(env.API_PORT).toBe(3202);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5217']);
  });

  it('rejects an invalid port', () => {
    expect(() => validateApiEnv({ API_PORT: '0' })).toThrow(/API_PORT/);
  });
});
