import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/': 'Início',
};

function useRouteTitle(): string {
  const location = useLocation();

  return routeTitles[location.pathname] ?? 'Página não encontrada';
}

function RouteAnnouncer(): ReactElement {
  const title = useRouteTitle();
  const location = useLocation();
  const announcementRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    document.title = `${title} · Nexo CRM`;

    if (announcementRef.current) {
      announcementRef.current.textContent = `Navegou para ${title}`;
    }
  }, [title, location.pathname]);

  return <p ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />;
}

function HomePage(): ReactElement {
  return (
    <section aria-labelledby="home-title" className="space-y-8">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">
          Fase 0 · Fundação
        </p>
        <h1 id="home-title" className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Nexo CRM
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Monorepo GraphQL para times pequenos de vendas. Esta base entrega tooling, aplicações
          esqueleto, infraestrutura local e documentação antes do domínio.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        <li className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white">API</h2>
          <p className="mt-2 text-sm text-slate-300">
            NestJS com health checks, validação de ambiente e middlewares de segurança.
          </p>
        </li>
        <li className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white">Worker</h2>
          <p className="mt-2 text-sm text-slate-300">
            Aplicação independente preparada para consumir eventos assíncronos.
          </p>
        </li>
        <li className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white">Web</h2>
          <p className="mt-2 text-sm text-slate-300">
            Shell acessível com navegação por teclado e anúncio de mudança de rota.
          </p>
        </li>
      </ul>
    </section>
  );
}

function NotFoundPage(): ReactElement {
  return (
    <section aria-labelledby="not-found-title" className="space-y-4">
      <h1 id="not-found-title" className="text-3xl font-semibold tracking-tight">
        Página não encontrada
      </h1>
      <p className="text-slate-300">O endereço acessado não existe neste aplicativo.</p>
      <Link
        to="/"
        className="inline-flex rounded-md bg-cyan-400 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        Voltar para o início
      </Link>
    </section>
  );
}

export function App(): ReactElement {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:text-slate-950"
      >
        Pular para o conteúdo
      </a>

      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="rounded-md text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
          >
            Nexo CRM
          </Link>

          <nav aria-label="Navegação principal">
            <ul className="flex items-center gap-4 text-sm">
              <li>
                <Link
                  to="/"
                  className="rounded-md text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                >
                  Início
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-12 focus:outline-none"
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <RouteAnnouncer />
    </div>
  );
}
