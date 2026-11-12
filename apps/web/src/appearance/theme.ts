export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nexo.theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Storage indisponível; usar preferência do sistema.
  }

  return 'system';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  }

  return preference;
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);

  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;

  return resolved;
}

export function storeTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Preferência não persiste; o tema atual continua aplicado.
  }
}

export function watchSystemTheme(listener: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const handleChange = (): void => listener();

  media.addEventListener('change', handleChange);

  return () => media.removeEventListener('change', handleChange);
}
