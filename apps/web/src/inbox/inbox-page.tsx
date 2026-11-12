import { useQuery } from '@apollo/client/react';
import {
  ConversationsListDocument,
  type ConversationsListQuery,
  type ConversationsListQueryVariables,
} from '@nexo/graphql-schema/operations';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fullName } from '../contacts/contact-utils';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { formatDateTime } from '../i18n/messages';
import { Button } from '../ui/button';
import { EmptyState, ErrorState, LoadingState } from '../ui/states';
import { useDebouncedValue } from '../ui/use-debounced-value';

const PAGE_SIZE = 20;

interface ConversationListProps {
  activeId?: string;
  showSearch?: boolean;
}

export function ConversationListPanel({
  activeId,
  showSearch = true,
}: ConversationListProps): ReactElement {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(searchParam);
  const [loadingMore, setLoadingMore] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const variables: ConversationsListQueryVariables = {
    first: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
  };
  const { data, loading, error, refetch, fetchMore } = useQuery<
    ConversationsListQuery,
    ConversationsListQueryVariables
  >(ConversationsListDocument, { variables, fetchPolicy: 'cache-and-network' });
  const conversations = data?.conversations.edges ?? [];
  const hasNextPage = data?.conversations.pageInfo.hasNextPage ?? false;
  const endCursor = data?.conversations.pageInfo.endCursor ?? null;
  const normalizedError = error ? normalizeApolloError(error) : null;
  const hasFilters = searchParam.trim().length > 0;

  function updateSearch(value: string): void {
    setSearchInput(value);
    const next = new URLSearchParams(searchParams);

    if (value.length > 0) {
      next.set('search', value);
    } else {
      next.delete('search');
    }

    setSearchParams(next, { replace: true });
  }

  function clearFilters(): void {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  async function handleLoadMore(): Promise<void> {
    if (!endCursor) {
      return;
    }

    setLoadingMore(true);

    try {
      await fetchMore({
        variables: { ...variables, after: endCursor },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!previous || !fetchMoreResult) {
            return previous ?? fetchMoreResult;
          }

          const seen = new Set(previous.conversations.edges.map((edge) => edge.node.id));
          const nextEdges = fetchMoreResult.conversations.edges.filter(
            (edge) => !seen.has(edge.node.id),
          );

          return {
            conversations: {
              ...fetchMoreResult.conversations,
              edges: [...previous.conversations.edges, ...nextEdges],
            },
          };
        },
      });
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-4">
      {showSearch ? (
        <div>
          <label htmlFor="inbox-search" className="mb-1 block text-sm font-medium">
            {t('inbox.search')}
          </label>
          <input
            id="inbox-search"
            type="search"
            value={searchInput}
            placeholder={t('inbox.searchPlaceholder')}
            onChange={(event) => updateSearch(event.target.value)}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          />
        </div>
      ) : null}

      {loading && conversations.length === 0 ? <LoadingState label={t('inbox.loading')} /> : null}

      {normalizedError && conversations.length === 0 ? (
        <ErrorState
          message={normalizedError.kind === 'network' ? t('common.networkError') : t('inbox.error')}
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      ) : null}

      {!loading && !error && conversations.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title={t('inbox.noResultsTitle')}
            description={t('inbox.noResultsDescription')}
            action={
              <Button variant="secondary" onClick={clearFilters}>
                {t('common.clearFilters')}
              </Button>
            }
          />
        ) : (
          <EmptyState title={t('inbox.emptyTitle')} description={t('inbox.emptyDescription')} />
        )
      ) : null}

      {conversations.length > 0 ? (
        <ul className="space-y-2" aria-label={t('inbox.title')}>
          {conversations.map(({ node }) => {
            const name = fullName(node.contact);
            const isActive = node.id === activeId;

            return (
              <li key={node.id}>
                <Link
                  to={`/inbox/${node.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={t('inbox.openConversation', { name })}
                  className={`block space-y-1 rounded-[var(--radius-control)] border p-3 text-sm ${
                    isActive
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface-muted)]'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]'
                  }`}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{name}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatDateTime(String(node.lastMessageAt))}
                    </span>
                  </span>
                  {node.contact.phone ? (
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {node.contact.phone}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {hasNextPage ? (
        <Button variant="secondary" busy={loadingMore} onClick={() => void handleLoadMore()}>
          {loadingMore ? t('inbox.loadingMore') : t('inbox.loadMore')}
        </Button>
      ) : null}
    </div>
  );
}

export function InboxPage(): ReactElement {
  const { t } = useI18n();

  return (
    <section aria-labelledby="page-title" className="space-y-6">
      <header className="space-y-1">
        <h1 id="page-title" className="text-3xl font-semibold tracking-tight">
          {t('inbox.title')}
        </h1>
        <p className="text-[var(--color-text-muted)]">{t('inbox.description')}</p>
      </header>

      <ConversationListPanel />
    </section>
  );
}
