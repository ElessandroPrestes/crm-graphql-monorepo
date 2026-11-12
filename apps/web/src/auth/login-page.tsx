import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AuthError } from './api';
import { useAuth } from './auth-context';
import { useI18n } from '../i18n/i18n-context';

interface LoginForm {
  email: string;
  password: string;
}

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

export function LoginPage(): ReactElement {
  const { t } = useI18n();
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.email(t('login.invalidEmail')),
        password: z.string().min(1, t('login.requiredPassword')),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo, status]);

  async function onSubmit(values: LoginForm): Promise<void> {
    setAuthError(null);

    try {
      await signIn(values);
      navigate(returnTo, { replace: true });
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) {
        setAuthError(t('login.unauthorized'));
        return;
      }

      if (error instanceof AuthError && error.status === 0) {
        setAuthError(t('login.network'));
        return;
      }

      setAuthError(t('login.error'));
    }
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-4 py-12 text-[var(--color-text)] focus:outline-none"
    >
      <section aria-labelledby="login-title" className="w-full max-w-md space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
            {t('app.name')}
          </p>
          <h1 id="login-title" className="text-3xl font-semibold tracking-tight">
            {t('login.title')}
          </h1>
          <p className="text-[var(--color-text-muted)]">{t('login.subtitle')}</p>
        </header>

        <form noValidate className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {authError ? (
            <p
              role="alert"
              className="rounded-[var(--radius-control)] border border-[var(--color-danger)] px-3 py-2 text-sm text-[var(--color-danger)]"
            >
              {authError}
            </p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-sm font-medium">
              {t('login.email')}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              {...register('email')}
            />
            {errors.email ? (
              <p id="login-email-error" className="text-sm text-[var(--color-danger)]">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-sm font-medium">
              {t('login.password')}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              {...register('password')}
            />
            {errors.password ? (
              <p id="login-password-error" className="text-sm text-[var(--color-danger)]">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full justify-center rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </section>
    </main>
  );
}
