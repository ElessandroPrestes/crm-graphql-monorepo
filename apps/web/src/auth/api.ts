import { API_URL } from '../config';
import type { AuthResponse, LoginCredentials } from './types';

export class AuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

interface ErrorBody {
  message?: string | string[];
  statusCode?: number;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    const message = Array.isArray(body.message) ? body.message[0] : body.message;

    if (message) {
      return message;
    }
  } catch {
    // Resposta sem JSON legível; usar mensagem genérica.
  }

  if (response.status === 401) {
    return 'E-mail ou senha inválidos.';
  }

  return 'Não foi possível concluir a solicitação.';
}

async function request(path: string, init: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new AuthError('Não foi possível conectar ao servidor.', 0);
  }

  if (!response.ok) {
    throw new AuthError(await readError(response), response.status);
  }

  return response;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  return (await response.json()) as AuthResponse;
}

export async function refresh(): Promise<AuthResponse> {
  const response = await request('/auth/refresh', { method: 'POST' });

  return (await response.json()) as AuthResponse;
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}
