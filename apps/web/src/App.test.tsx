import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function renderApp(path = '/'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App shell', () => {
  it('renders an accessible skip link, main landmark and single h1', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /pular para o conteúdo/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /nexo crm/i })).toBeInTheDocument();
  });

  it('announces the current route in the document title', () => {
    renderApp();

    expect(document.title).toBe('Início · Nexo CRM');
  });

  it('renders the not found page for unknown routes', () => {
    renderApp('/rota-inexistente');

    expect(
      screen.getByRole('heading', { level: 1, name: /página não encontrada/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para o início/i })).toBeInTheDocument();
  });
});
