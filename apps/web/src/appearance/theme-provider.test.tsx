import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './theme-provider';
import { THEME_STORAGE_KEY } from './theme';

function installMatchMedia(matches: boolean) {
  const media = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );

  return media;
}

function ThemeProbe() {
  const { preference, setPreference } = useTheme();

  return (
    <div>
      <p>{preference}</p>
      <button type="button" onClick={() => setPreference('light')}>
        Tema claro
      </button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
});

describe('ThemeProvider', () => {
  it('restores the stored preference and applies the resolved theme', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    installMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  it('follows the system theme by default and persists an explicit choice', async () => {
    const media = installMatchMedia(true);
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    await user.click(screen.getByRole('button', { name: /tema claro/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(media.removeEventListener).toHaveBeenCalled();
  });
});
