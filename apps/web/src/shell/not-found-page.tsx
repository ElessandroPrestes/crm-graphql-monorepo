import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/i18n-context';

export function NotFoundPage(): ReactElement {
  const { t } = useI18n();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-4 py-12 text-[var(--color-text)] focus:outline-none"
    >
      <section aria-labelledby="not-found-title" className="w-full max-w-md space-y-4 text-center">
        <h1 id="not-found-title" className="text-3xl font-semibold tracking-tight">
          {t('notFound.title')}
        </h1>
        <p className="text-[var(--color-text-muted)]">{t('notFound.description')}</p>
        <Link
          to="/"
          className="inline-flex rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          {t('notFound.back')}
        </Link>
      </section>
    </main>
  );
}
