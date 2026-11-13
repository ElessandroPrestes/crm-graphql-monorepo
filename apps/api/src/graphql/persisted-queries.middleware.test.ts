import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { PERSISTED_QUERIES } from './persisted-queries.generated.js';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { ApiEnv } from '../config/env.js';
import { PersistedQueryMiddleware } from './persisted-queries.middleware.js';

function middleware(mode: ApiEnv['PERSISTED_QUERIES_MODE']): PersistedQueryMiddleware {
  const config = {
    get: () => mode,
  } as unknown as ConfigService<ApiEnv, true>;

  return new PersistedQueryMiddleware(config);
}

function responseMock(): {
  response: Response;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
} {
  const status = vi.fn();
  const json = vi.fn();
  const setHeader = vi.fn();
  const response = { status, json, setHeader } as unknown as Response;

  status.mockReturnValue(response);

  return { response, status, json, setHeader };
}

const [knownHash, knownEntry] = Object.entries(PERSISTED_QUERIES)[0]!;

describe('PersistedQueryMiddleware', () => {
  it('injeta a query da allowlist quando o hash é conhecido', () => {
    const next = vi.fn() as unknown as NextFunction;
    const request = {
      method: 'POST',
      body: { extensions: { persistedQuery: { sha256Hash: knownHash } } },
    } as unknown as Request;
    const { response } = responseMock();

    middleware('enforce').use(request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(request.body.query).toBe(knownEntry.query);
  });

  it('em audit, permite query fora da allowlist e registra aviso', () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const next = vi.fn() as unknown as NextFunction;
    const request = {
      method: 'POST',
      body: {
        query: 'query { __typename }',
        extensions: { persistedQuery: { sha256Hash: 'unknown-hash' } },
      },
    } as unknown as Request;
    const { response } = responseMock();

    middleware('audit').use(request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('em enforce, rejeita hash desconhecido sem chamar o resolver', () => {
    const next = vi.fn() as unknown as NextFunction;
    const request = {
      method: 'POST',
      body: {
        query: 'query { __typename }',
        extensions: { persistedQuery: { sha256Hash: 'unknown-hash' } },
      },
    } as unknown as Request;
    const { response, status, json } = responseMock();

    middleware('enforce').use(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      errors: [
        {
          message: 'PersistedQueryNotFound',
          extensions: { code: 'PERSISTED_QUERY_NOT_FOUND' },
        },
      ],
    });
  });

  it('em enforce, rejeita GET para impedir bypass da allowlist', () => {
    const next = vi.fn() as unknown as NextFunction;
    const request = { method: 'GET', body: undefined } as unknown as Request;
    const { response, status, json } = responseMock();

    middleware('enforce').use(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(405);
    expect(json).toHaveBeenCalledWith({
      errors: [
        {
          message: 'Use POST com persisted query',
          extensions: { code: 'PERSISTED_QUERY_REQUIRED' },
        },
      ],
    });
  });

  it('em enforce, exige hash em requisições POST', () => {
    const next = vi.fn() as unknown as NextFunction;
    const request = {
      method: 'POST',
      body: { query: 'query { me { id } }' },
    } as unknown as Request;
    const { response, json } = responseMock();

    middleware('enforce').use(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({
      errors: [
        {
          message: 'PersistedQueryRequired',
          extensions: { code: 'PERSISTED_QUERY_REQUIRED' },
        },
      ],
    });
  });
});
