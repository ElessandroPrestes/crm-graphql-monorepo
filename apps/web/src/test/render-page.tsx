import { InMemoryCache } from '@apollo/client';
import { MockedProvider, type MockedProviderProps } from '@apollo/client/testing/react';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/i18n-context';

interface RenderPageOptions {
  mocks?: MockedProviderProps['mocks'];
  initialEntries?: string[];
}

export function renderPage(
  ui: ReactElement,
  { mocks = [], initialEntries = ['/'] }: RenderPageOptions = {},
): RenderResult {
  return render(
    <I18nProvider>
      <MockedProvider mocks={mocks} cache={new InMemoryCache()}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </MockedProvider>
    </I18nProvider>,
  );
}
