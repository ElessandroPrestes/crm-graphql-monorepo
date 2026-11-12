import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../appearance/theme-toggle';
import { useAuth } from '../auth/auth-context';
import { useI18n } from '../i18n/i18n-context';
import type { MessageKey } from '../i18n/messages';
import { routeTitleKey } from './route-title';

interface NavItem {
  to: string;
  labelKey: MessageKey;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', end: true },
  { to: '/contacts', labelKey: 'nav.contacts' },
  { to: '/pipeline', labelKey: 'nav.pipeline' },
  { to: '/inbox', labelKey: 'nav.inbox' },
];

export function RouteAnnouncer(): ReactElement {
  const { t } = useI18n();
  const location = useLocation();
  const title = t(routeTitleKey(location.pathname));
  const announcementRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    document.title = `${title} · ${t('title.suffix')}`;

    if (announcementRef.current) {
      announcementRef.current.textContent = t('route.announcement', { title });
    }
  }, [location.pathname, t, title]);

  return <p ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />;
}

export function AppShell(): ReactElement {
  const { t } = useI18n();
  const { session, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleSignOut(): Promise<void> {
    setSigningOut(true);

    try {
      await signOut();
    } finally {
      setSigningOut(false);
      navigate('/login', { replace: true });
    }
  }

  const navClassName = menuOpen ? 'block' : 'hidden lg:block';
  const roleKey = session?.user.role === 'ADMIN' ? 'role.admin' : 'role.seller';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:font-medium focus:text-[var(--color-text)]"
      >
        {t('shell.skipToContent')}
      </a>

      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="rounded-[var(--radius-control)] text-lg font-semibold tracking-tight"
          >
            {t('app.name')}
          </Link>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            className="rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-1 text-sm lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          </button>

          <nav
            id="primary-navigation"
            aria-label={t('nav.primary')}
            className={`${navClassName} order-last w-full lg:order-none lg:w-auto`}
          >
            <ul className="flex flex-col gap-3 text-sm lg:flex-row lg:items-center lg:gap-5">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `rounded-[var(--radius-control)] ${
                        isActive
                          ? 'font-semibold text-[var(--color-primary)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                      }`
                    }
                  >
                    {t(item.labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {session ? (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{t(roleKey)}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('shell.signOut')}
            </button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 py-10 focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}
