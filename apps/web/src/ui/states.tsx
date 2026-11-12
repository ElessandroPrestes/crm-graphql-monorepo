import type { ReactElement, ReactNode } from 'react';
import { Button } from './button';

interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps): ReactElement {
  return (
    <p role="status" aria-live="polite" className="text-sm text-[var(--color-text-muted)]">
      {label}
    </p>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ message, onRetry, retryLabel }: ErrorStateProps): ReactElement {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-[var(--radius-panel)] border border-[var(--color-danger)] p-4"
    >
      <p className="text-sm text-[var(--color-danger)]">{message}</p>
      {onRetry && retryLabel ? (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps): ReactElement {
  return (
    <div className="space-y-3 rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border)] p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      {action}
    </div>
  );
}

interface InlineNoticeProps {
  tone?: 'info' | 'success' | 'danger' | 'warning';
  children: ReactNode;
  live?: 'polite' | 'assertive';
}

const toneClasses = {
  info: 'border-[var(--color-border)] text-[var(--color-text)]',
  success: 'border-[var(--color-success)] text-[var(--color-success)]',
  danger: 'border-[var(--color-danger)] text-[var(--color-danger)]',
  warning: 'border-[var(--color-warning)] text-[var(--color-warning)]',
} as const;

export function InlineNotice({ tone = 'info', children, live }: InlineNoticeProps): ReactElement {
  return (
    <p
      role={live === 'assertive' ? 'alert' : 'status'}
      aria-live={live}
      className={`rounded-[var(--radius-control)] border px-3 py-2 text-sm ${toneClasses[tone]}`}
    >
      {children}
    </p>
  );
}
