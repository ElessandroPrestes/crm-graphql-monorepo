import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/i18n-context';
import { useAuth } from './auth-context';

function SessionLoading(): ReactElement {
  const { t } = useI18n();

  return (
    <main id="main-content" className="grid min-h-screen place-items-center px-4">
      <p role="status" className="text-sm text-[var(--color-text-muted)]">
        {t('session.loading')}
      </p>
    </main>
  );
}

export function RequireAuth(): ReactElement {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <SessionLoading />;
  }

  if (status === 'anonymous') {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
}
