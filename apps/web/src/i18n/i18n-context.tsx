import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import { translate, type MessageKey, type TranslateParams } from './messages';

export const LOCALE = 'pt-BR';

interface I18nContextValue {
  locale: typeof LOCALE;
  t: (key: MessageKey, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }): ReactElement {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale: LOCALE,
      t: translate,
    }),
    [],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n deve ser usado dentro de I18nProvider');
  }

  return context;
}
