import { ApolloProvider } from '@apollo/client/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { ThemeProvider } from './appearance/theme-provider';
import { AuthProvider } from './auth/auth-context';
import { apolloClient } from './graphql/client';
import { I18nProvider } from './i18n/i18n-context';

const authResponse = {
  accessToken: 'test-access-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ana Vendedora',
    email: 'ana@nexo.local',
    role: 'SELLER',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function mockFetch({ authenticated = true }: { authenticated?: boolean } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.endsWith('/auth/refresh')) {
      return authenticated
        ? jsonResponse(authResponse)
        : jsonResponse({ message: 'Unauthorized' }, 401);
    }

    if (url.endsWith('/auth/login')) {
      return jsonResponse(authResponse);
    }

    if (url.endsWith('/auth/logout')) {
      return jsonResponse({});
    }

    throw new Error(`Requisição inesperada: ${url}`);
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function renderApp(path = '/'): ReturnType<typeof render> {
  return render(
    <I18nProvider>
      <ThemeProvider>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            <MemoryRouter initialEntries={[path]}>
              <App />
            </MemoryRouter>
          </AuthProvider>
        </ApolloProvider>
      </ThemeProvider>
    </I18nProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App shell', () => {
  it('renders skip link, main landmark, navigation and a single h1', async (): Promise<void> => {
    mockFetch();
    renderApp();

    expect(await screen.findByRole('link', { name: /pular para o conteúdo/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 1, name: /dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('announces the current route in the document title', async (): Promise<void> => {
    mockFetch();
    renderApp('/contacts');

    await screen.findByRole('heading', { level: 1, name: /contatos/i });

    await waitFor(() => {
      expect(document.title).toBe('Contatos · Nexo CRM');
    });
  });

  it('renders the not found page for unknown routes', async (): Promise<void> => {
    mockFetch();
    renderApp('/rota-inexistente');

    expect(
      await screen.findByRole('heading', { level: 1, name: /página não encontrada/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para o início/i })).toBeInTheDocument();
  });

  it('redirects anonymous users to login and returns to the original route after sign in', async (): Promise<void> => {
    const fetchMock = mockFetch({ authenticated: false });
    const user = userEvent.setup();
    renderApp('/contacts');

    expect(await screen.findByRole('heading', { level: 1, name: /entrar/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/e-mail/i), 'ana@nexo.local');
    await user.type(screen.getByLabelText(/senha/i), 'NexoDemo!2026');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /contatos/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows an actionable message for invalid credentials', async (): Promise<void> => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/auth/refresh')) {
        return jsonResponse({ message: 'Unauthorized' }, 401);
      }

      return jsonResponse({ message: 'Unauthorized' }, 401);
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp('/login');

    await screen.findByRole('heading', { level: 1, name: /entrar/i });
    await user.type(screen.getByLabelText(/e-mail/i), 'ana@nexo.local');
    await user.type(screen.getByLabelText(/senha/i), 'senha-errada');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/e-mail ou senha inválidos/i);
  });
});
