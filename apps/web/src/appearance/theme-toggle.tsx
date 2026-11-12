import type { ReactElement } from 'react';
import { useI18n } from '../i18n/i18n-context';
import { useTheme } from './theme-provider';
import type { ThemePreference } from './theme';

export function ThemeToggle(): ReactElement {
  const { preference, setPreference } = useTheme();
  const { t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
      <span>{t('shell.theme')}</span>
      <select
        value={preference}
        onChange={(event) => setPreference(event.target.value as ThemePreference)}
        className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-text)]"
      >
        <option value="light">{t('shell.themeLight')}</option>
        <option value="dark">{t('shell.themeDark')}</option>
        <option value="system">{t('shell.themeSystem')}</option>
      </select>
    </label>
  );
}
