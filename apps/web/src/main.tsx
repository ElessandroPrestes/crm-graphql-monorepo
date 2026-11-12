import { ApolloProvider } from '@apollo/client/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ThemeProvider } from './appearance/theme-provider';
import { AuthProvider } from './auth/auth-context';
import { apolloClient } from './graphql/client';
import { I18nProvider } from './i18n/i18n-context';
import './app.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ApolloProvider>
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
);
