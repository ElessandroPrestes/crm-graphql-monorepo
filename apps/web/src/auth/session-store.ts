import { login as loginRequest, logout as logoutRequest, refresh as refreshRequest } from './api';
import type { AuthResponse, LoginCredentials, Session } from './types';

let currentSession: Session | null = null;
let refreshInFlight: Promise<Session | null> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function toSession(response: AuthResponse): Session {
  return {
    accessToken: response.accessToken,
    expiresAt: Date.now() + response.expiresIn * 1000,
    user: response.user,
  };
}

export function getSession(): Session | null {
  return currentSession;
}

export function getAccessToken(): string | null {
  return currentSession?.accessToken ?? null;
}

export function setSession(response: AuthResponse): Session {
  currentSession = toSession(response);
  notify();

  return currentSession;
}

export function clearSession(): void {
  if (currentSession === null) {
    return;
  }

  currentSession = null;
  notify();
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export async function refreshSession(): Promise<Session | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      return setSession(await refreshRequest());
    } catch {
      clearSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function signIn(credentials: LoginCredentials): Promise<Session> {
  return setSession(await loginRequest(credentials));
}

export async function signOut(): Promise<void> {
  try {
    await logoutRequest();
  } finally {
    clearSession();
  }
}
