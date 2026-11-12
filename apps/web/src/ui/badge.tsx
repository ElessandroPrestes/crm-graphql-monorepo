import type { ReactElement, ReactNode } from 'react';
import { cn } from './cn';

type BadgeTone = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-[var(--color-border)] text-[var(--color-text-muted)]',
  info: 'border-[var(--color-primary)] text-[var(--color-primary)]',
  success: 'border-[var(--color-success)] text-[var(--color-success)]',
  danger: 'border-[var(--color-danger)] text-[var(--color-danger)]',
  warning: 'border-[var(--color-warning)] text-[var(--color-warning)]',
};

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
