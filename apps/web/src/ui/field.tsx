import { useId, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { cn } from './cn';

const controlClasses =
  'w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-60';

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}

function FieldShell({ label, error, hint, htmlFor, children }: FieldShellProps): ReactElement {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: TextFieldProps): ReactElement {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy =
    [hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(controlClasses, className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends ComponentProps<'textarea'> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextAreaField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: TextAreaFieldProps): ReactElement {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(controlClasses, 'min-h-24', className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string;
  error?: string;
  hint?: string;
}

export function SelectField({
  label,
  error,
  hint,
  id,
  className,
  children,
  ...rest
}: SelectFieldProps): ReactElement {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId}>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(controlClasses, className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}
