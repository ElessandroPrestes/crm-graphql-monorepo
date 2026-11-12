import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';

export type AppErrorKind =
  'unauthorized' | 'forbidden' | 'notFound' | 'validation' | 'conflict' | 'network' | 'unknown';

export interface AppError {
  kind: AppErrorKind;
  message?: string;
  code?: string;
}

function kindFromCode(code: string | undefined): AppErrorKind | null {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 'unauthorized';
    case 'FORBIDDEN':
      return 'forbidden';
    case 'NOT_FOUND':
      return 'notFound';
    case 'CONFLICT':
      return 'conflict';
    case 'BAD_REQUEST':
    case 'BAD_USER_INPUT':
    case 'VALIDATION_ERROR':
      return 'validation';
    default:
      return null;
  }
}

function kindFromStatus(status: number | undefined): AppErrorKind | null {
  if (status === 401) {
    return 'unauthorized';
  }

  if (status === 403) {
    return 'forbidden';
  }

  if (status === 404) {
    return 'notFound';
  }

  if (status === 409) {
    return 'conflict';
  }

  if (status !== undefined && status >= 400 && status < 500) {
    return 'validation';
  }

  if (status !== undefined && status >= 500) {
    return 'network';
  }

  return null;
}

export function normalizeApolloError(error: unknown): AppError {
  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors.at(0);
    const code = typeof first?.extensions?.code === 'string' ? first.extensions.code : undefined;

    return {
      kind: kindFromCode(code) ?? 'unknown',
      message: first?.message,
      code,
    };
  }

  if (ServerError.is(error)) {
    return {
      kind: kindFromStatus(error.statusCode) ?? 'network',
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      kind: /fetch|network|failed to fetch/i.test(error.message) ? 'network' : 'unknown',
      message: error.message,
    };
  }

  return { kind: 'unknown' };
}

export function isNotFoundError(error: unknown): boolean {
  return normalizeApolloError(error).kind === 'notFound';
}
