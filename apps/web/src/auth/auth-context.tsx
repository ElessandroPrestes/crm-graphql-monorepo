import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';
import { apolloClient, resetApolloState } from '../graphql/client';
import {
  getSession,
  refreshSession,
  signIn as signInStore,
  signOut as signOutStore,
  subscribeToSession,
} from './session-store';
import type { LoginCredentials, Session } from './types';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  signIn: (credentials: LoginCredentials) => Promise<Session>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const session = useSyncExternalStore(subscribeToSession, getSession, getSession);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;

    void refreshSession().finally(() => {
      if (active) {
        setBootstrapped(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const nextSession = await signInStore(credentials);

    await apolloClient.clearStore();

    return nextSession;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutStore();
    } finally {
      await resetApolloState();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: bootstrapped ? (session ? 'authenticated' : 'anonymous') : 'loading',
      session,
      signIn,
      signOut,
    }),
    [bootstrapped, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
