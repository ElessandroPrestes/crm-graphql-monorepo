import { useQuery } from '@apollo/client/react';
import {
  CompaniesListDocument,
  ContactsListDocument,
  type CompaniesListQuery,
  type ContactsListQuery,
  type ContactsListQueryVariables,
} from '@nexo/graphql-schema/operations';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { formatNumber } from '../i18n/messages';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { LoadingState, EmptyState, ErrorState, InlineNotice } from '../ui/states';
import { useDebouncedValue } from '../ui/use-debounced-value';
import { fullName } from './contact-utils';
import { CreateContactDialog } from './create-contact-dialog';

const PAGE_SIZE = 20;

export function ContactsPage(): ReactElement {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') ?? '';
  const companyParam = searchParams.get('companyId') ?? '';
  const [searchInput, setSearchInput] = useState(searchParam);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const hasFilters = searchParam.trim().length > 0 || companyParam.length > 0;

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const variables: ContactsListQueryVariables = {
    first: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    companyId: companyParam || undefined,
  };

  const { data, loading, error, refetch, fetchMore } = useQuery<
    ContactsListQuery,
    ContactsListQueryVariables
  >(ContactsListDocument, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const companiesQuery = useQuery<CompaniesListQuery>(CompaniesListDocument, {
    variables: { first: 100 },
  });

  const companies = companiesQuery.data?.companies.edges ?? [];
  const contacts = data?.contacts.edges ?? [];
  const hasNextPage = data?.contacts.pageInfo.hasNextPage ?? false;
  const endCursor = data?.contacts.pageInfo.endCursor ?? null;
  const normalizedError = error ? normalizeApolloError(error) : null;

  function updateFilter(key: 'search' | 'companyId', value: string): void {
    const next = new URLSearchParams(searchParams);

    if (value.length > 0) {
      next.set(key, value);
    } else {
      next.delete(key);
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
    setMoreError(false);

    try {
      await fetchMore({
        variables: { ...variables, after: endCursor },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!previous || !fetchMoreResult) {
            return previous ?? fetchMoreResult;
          }

          const seen = new Set(previous.contacts.edges.map((edge) => edge.node.id));
          const nextEdges = fetchMoreResult.contacts.edges.filter(
            (edge) => !seen.has(edge.node.id),
          );

          return {
            contacts: {
              ...fetchMoreResult.contacts,
              edges: [...previous.contacts.edges, ...nextEdges],
            },
          };
        },
      });
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section aria-labelledby="page-title" className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">
            {t('contacts.title')}
          </h1>
          <p className="text-[var(--color-text-muted)]">{t('contacts.description')}</p>
        </div>

        <Button onClick={() => setDialogOpen(true)}>{t('contacts.new')}</Button>
      </header>

      {created ? <InlineNotice tone="success">{t('contacts.createSuccess')}</InlineNotice> : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
        <div>
          <label htmlFor="contacts-search" className="mb-1 block text-sm font-medium">
            {t('contacts.search')}
          </label>
          <input
            id="contacts-search"
            type="search"
            value={searchInput}
            placeholder={t('contacts.searchPlaceholder')}
            onChange={(event) => {
              setSearchInput(event.target.value);
              updateFilter('search', event.target.value);
            }}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          />
        </div>

        <div>
          <label htmlFor="contacts-company" className="mb-1 block text-sm font-medium">
            {t('contacts.company')}
          </label>
          <select
            id="contacts-company"
            value={companyParam}
            onChange={(event) => updateFilter('companyId', event.target.value)}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <option value="">{t('contacts.allCompanies')}</option>
            {companies.map(({ node }) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && contacts.length === 0 ? <LoadingState label={t('contacts.loading')} /> : null}

      {normalizedError && contacts.length === 0 ? (
        <ErrorState
          message={
            normalizedError.kind === 'network' ? t('common.networkError') : t('contacts.error')
          }
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      ) : null}

      {!loading && !error && contacts.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title={t('contacts.noResultsTitle')}
            description={t('contacts.noResultsDescription')}
            action={
              <Button variant="secondary" onClick={clearFilters}>
                {t('common.clearFilters')}
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={t('contacts.emptyTitle')}
            description={t('contacts.emptyDescription')}
            action={<Button onClick={() => setDialogOpen(true)}>{t('contacts.new')}</Button>}
          />
        )
      ) : null}

      {contacts.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('contacts.count', { count: formatNumber(contacts.length) })}
          </p>

          <div
            role="region"
            aria-label={t('contacts.title')}
            tabIndex={0}
            className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)]"
          >
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">{t('contacts.title')}</caption>
              <thead className="bg-[var(--color-surface-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('contacts.name')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('contacts.email')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('contacts.phone')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('contacts.company')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(({ node }) => {
                  const name = fullName(node);

                  return (
                    <tr key={node.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">
                        <Link
                          to={`/contacts/${node.id}`}
                          aria-label={t('contacts.open', { name })}
                          className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                        >
                          {name}
                        </Link>
                        {node.jobTitle ? (
                          <p className="text-xs text-[var(--color-text-muted)]">{node.jobTitle}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {node.email ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {node.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {node.company ? (
                          <Badge tone="info">{node.company.name}</Badge>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">
                            {t('contacts.noCompany')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {moreError ? (
            <InlineNotice tone="danger">{t('contacts.loadMoreError')}</InlineNotice>
          ) : null}

          <div className="flex justify-center">
            {hasNextPage ? (
              <Button variant="secondary" busy={loadingMore} onClick={() => void handleLoadMore()}>
                {loadingMore ? t('contacts.loadingMore') : t('contacts.loadMore')}
              </Button>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">{t('contacts.endOfList')}</p>
            )}
          </div>
        </div>
      ) : null}

      <CreateContactDialog
        open={dialogOpen}
        companies={companies}
        onClose={() => setDialogOpen(false)}
        onCreated={async () => {
          setCreated(true);
          await refetch();
        }}
      />
    </section>
  );
}
