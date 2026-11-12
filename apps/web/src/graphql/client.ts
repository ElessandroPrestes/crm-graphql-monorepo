import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, type ErrorLike } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { Observable, getMainDefinition } from '@apollo/client/utilities';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { createClient } from 'graphql-ws';
import { clearSession, getAccessToken, refreshSession } from '../auth/session-store';
import { GRAPHQL_HTTP_URL, GRAPHQL_WS_URL } from '../config';

function isAuthenticationError(error: ErrorLike): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some((item) => item.extensions?.code === 'UNAUTHENTICATED');
  }

  return ServerError.is(error) && error.statusCode === 401;
}

const httpLink = new HttpLink({
  uri: GRAPHQL_HTTP_URL,
  credentials: 'include',
});

const authLink = new SetContextLink((previousContext) => {
  const token = getAccessToken();

  return {
    headers: {
      ...previousContext.headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (!isAuthenticationError(error)) {
    return;
  }

  const context = operation.getContext() as { authRetried?: boolean };

  if (context.authRetried) {
    clearSession();
    return;
  }

  return new Observable((observer) => {
    let subscription: { unsubscribe: () => void } | undefined;

    refreshSession()
      .then((session) => {
        if (!session) {
          observer.error(error);
          return;
        }

        operation.setContext({ ...context, authRetried: true });
        subscription = forward(operation).subscribe({
          next: (value) => observer.next(value),
          error: (nextError: unknown) => observer.error(nextError),
          complete: () => observer.complete(),
        });
      })
      .catch((nextError: unknown) => observer.error(nextError));

    return () => subscription?.unsubscribe();
  });
});

const wsClient = createClient({
  url: GRAPHQL_WS_URL,
  lazy: true,
  retryAttempts: 5,
  shouldRetry: () => true,
  connectionParams: () => {
    const token = getAccessToken();

    return token ? { authorization: `Bearer ${token}` } : {};
  },
});

const wsLink = new GraphQLWsLink(wsClient);

const terminatingLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);

    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  ApolloLink.from([errorLink, authLink, httpLink]),
);

export const apolloClient = new ApolloClient({
  link: terminatingLink,
  cache: new InMemoryCache(),
});

export function resetRealtimeConnection(): void {
  wsClient.terminate();
}

export async function resetApolloState(): Promise<void> {
  await apolloClient.clearStore();
  resetRealtimeConnection();
}
