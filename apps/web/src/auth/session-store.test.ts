import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authResponse = {
  accessToken: 'access-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ana Vendedora',
    email: 'ana@nexo.local',
    role: 'SELLER',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

async function loadStore() {
  vi.resetModules();
  return import('./session-store');
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('session store', () => {
  it('refreshes once for concurrent callers and keeps the token in memory', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(authResponse));
    vi.stubGlobal('fetch', fetchMock);
    const store = await loadStore();

    const [first, second] = await Promise.all([store.refreshSession(), store.refreshSession()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first?.accessToken).toBe('access-token');
    expect(second?.accessToken).toBe('access-token');
    expect(store.getAccessToken()).toBe('access-token');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('clears the session when refresh is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'Unauthorized' }, 401)),
    );
    const store = await loadStore();

    await expect(store.refreshSession()).resolves.toBeNull();
    expect(store.getSession()).toBeNull();
  });

  it('clears the session on sign out even when the request fails', async () => {
    const store = await loadStore();
    store.setSession(authResponse);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    );

    await expect(store.signOut()).rejects.toThrow();
    expect(store.getSession()).toBeNull();
  });

  it('notifies subscribers when the session changes', async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeToSession(listener);

    store.setSession(authResponse);
    store.clearSession();
    unsubscribe();
    store.setSession(authResponse);

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
