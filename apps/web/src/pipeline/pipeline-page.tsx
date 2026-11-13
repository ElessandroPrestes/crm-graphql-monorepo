import { useMutation, useQuery } from '@apollo/client/react';
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  CompaniesListDocument,
  DashboardMetricsDocument,
  PipelineDealsDocument,
  UpdateDealDocument,
  type CompaniesListQuery,
  type DashboardMetricsQuery,
  type DealCardFragment,
  type DealStage,
  type PipelineDealsQuery,
  type PipelineDealsQueryVariables,
  type UpdateDealMutation,
  type UpdateDealMutationVariables,
} from '@nexo/graphql-schema/operations';
import { useEffect, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OPEN_STAGES } from '../contacts/contact-utils';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { formatCurrencyFromCents } from '../i18n/messages';
import { Button } from '../ui/button';
import { EmptyState, ErrorState, InlineNotice, LoadingState } from '../ui/states';
import { useDebouncedValue } from '../ui/use-debounced-value';
import { DealCard } from './deal-card';
import { findDeal, groupDealsByStage, type DealStageGroup } from './deal-groups';

const PAGE_SIZE = 100;

type Notice = { tone: 'success' | 'danger' | 'warning'; text: string };

function StageColumn({
  group,
  movingId,
  onMove,
}: {
  group: DealStageGroup;
  movingId: string | null;
  onMove: (deal: DealCardFragment, stage: DealStage) => void;
}): ReactElement {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: group.stage });
  const headingId = `pipeline-stage-${group.stage}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={`min-w-[16rem] flex-1 space-y-3 rounded-[var(--radius-panel)] border p-3 ${
        isOver
          ? 'border-[var(--color-primary)] bg-[var(--color-surface-muted)]'
          : 'border-[var(--color-border)]'
      }`}
    >
      <header className="space-y-1">
        <h2 id={headingId} className="text-sm font-semibold uppercase tracking-wide">
          {t(`stage.${group.stage}`)}
        </h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          {t('pipeline.count', { count: group.count })} ·{' '}
          {formatCurrencyFromCents(group.totalCents)}
        </p>
      </header>

      {group.deals.length === 0 ? (
        <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] p-3 text-xs text-[var(--color-text-muted)]">
          {t('pipeline.emptyColumn')}
        </p>
      ) : (
        <ul className="space-y-2">
          {group.deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onMove={onMove} moving={movingId === deal.id} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function PipelinePage(): ReactElement {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') ?? '';
  const companyParam = searchParams.get('companyId') ?? '';
  const contactParam = searchParams.get('contactId') ?? '';
  const [searchInput, setSearchInput] = useState(searchParam);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const filtersActive =
    searchParam.length > 0 || companyParam.length > 0 || contactParam.length > 0;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const variables: PipelineDealsQueryVariables = {
    first: PAGE_SIZE,
    stages: OPEN_STAGES,
    search: debouncedSearch.trim() || undefined,
    companyId: companyParam || undefined,
    contactId: contactParam || undefined,
  };

  const pipelineQuery = useQuery<PipelineDealsQuery, PipelineDealsQueryVariables>(
    PipelineDealsDocument,
    { variables, fetchPolicy: 'cache-and-network' },
  );
  const metricsQuery = useQuery<DashboardMetricsQuery>(DashboardMetricsDocument);
  const companiesQuery = useQuery<CompaniesListQuery>(CompaniesListDocument, {
    variables: { first: 100 },
  });
  const [updateDeal] = useMutation<UpdateDealMutation, UpdateDealMutationVariables>(
    UpdateDealDocument,
  );

  const deals = pipelineQuery.data?.deals.edges.map((edge) => edge.node) ?? [];
  const groups = groupDealsByStage(deals);
  const companies = companiesQuery.data?.companies.edges ?? [];
  const metrics = metricsQuery.data?.dashboardMetrics;

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

  async function moveDeal(deal: DealCardFragment, stage: DealStage): Promise<void> {
    if (deal.stage === stage) {
      return;
    }

    setMovingId(deal.id);
    setNotice(null);

    try {
      await updateDeal({
        variables: { id: deal.id, input: { stage, expectedVersion: deal.version } },
      });
      await Promise.all([pipelineQuery.refetch(), metricsQuery.refetch()]);
      setNotice({
        tone: 'success',
        text: t('pipeline.moved', { stage: t(`stage.${stage}`) }),
      });
    } catch (error) {
      const normalized = normalizeApolloError(error);

      if (normalized.kind === 'conflict') {
        await pipelineQuery.refetch();
        setNotice({ tone: 'warning', text: t('pipeline.conflict') });
      } else if (normalized.kind === 'network') {
        setNotice({ tone: 'danger', text: t('pipeline.networkError') });
      } else {
        setNotice({ tone: 'danger', text: t('pipeline.moveError') });
      }
    } finally {
      setMovingId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || over.id === active.id) {
      return;
    }

    const deal = findDeal(deals, String(active.id));
    const stage = OPEN_STAGES.find((candidate) => candidate === over.id);

    if (deal && stage) {
      void moveDeal(deal, stage);
    }
  }

  const error = pipelineQuery.error ? normalizeApolloError(pipelineQuery.error) : null;

  return (
    <section aria-labelledby="page-title" className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">
            {t('pipeline.title')}
          </h1>
          <p className="text-[var(--color-text-muted)]">{t('pipeline.description')}</p>
        </div>

        <dl className="flex flex-wrap gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('pipeline.openValue')}
            </dt>
            <dd className="font-semibold">
              {formatCurrencyFromCents(
                groups.reduce((total, group) => total + group.totalCents, 0),
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('dashboard.wonDeals')}
            </dt>
            <dd className="font-semibold">
              {metrics
                ? `${metrics.wonDeals} · ${formatCurrencyFromCents(metrics.wonValueCents)}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('pipeline.lost')}
            </dt>
            <dd className="font-semibold">
              {metrics
                ? `${metrics.lostDeals} · ${formatCurrencyFromCents(metrics.lostValueCents)}`
                : '—'}
            </dd>
          </div>
        </dl>
      </header>

      <p className="text-sm text-[var(--color-text-muted)]">{t('pipeline.instructions')}</p>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
        <div>
          <label htmlFor="pipeline-search" className="mb-1 block text-sm font-medium">
            {t('pipeline.search')}
          </label>
          <input
            id="pipeline-search"
            type="search"
            value={searchInput}
            placeholder={t('pipeline.searchPlaceholder')}
            onChange={(event) => {
              setSearchInput(event.target.value);
              updateFilter('search', event.target.value);
            }}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          />
        </div>

        <div>
          <label htmlFor="pipeline-company" className="mb-1 block text-sm font-medium">
            {t('contacts.company')}
          </label>
          <select
            id="pipeline-company"
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

      {contactParam ? (
        <div className="flex flex-wrap items-center gap-3">
          <InlineNotice>{t('pipeline.contactFilterOnly')}</InlineNotice>
          <Button variant="secondary" onClick={clearFilters}>
            {t('common.clearFilters')}
          </Button>
        </div>
      ) : null}

      {notice ? (
        <InlineNotice tone={notice.tone} live={notice.tone === 'success' ? 'polite' : 'assertive'}>
          {notice.text}
        </InlineNotice>
      ) : null}

      {pipelineQuery.loading && deals.length === 0 ? (
        <LoadingState label={t('pipeline.loading')} />
      ) : null}

      {error && deals.length === 0 ? (
        <ErrorState
          message={error.kind === 'network' ? t('common.networkError') : t('pipeline.error')}
          onRetry={() => void pipelineQuery.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : null}

      {!pipelineQuery.loading && !error && deals.length === 0 ? (
        filtersActive ? (
          <EmptyState
            title={t('pipeline.noResultsTitle')}
            description={t('pipeline.noResultsDescription')}
            action={
              <Button variant="secondary" onClick={clearFilters}>
                {t('common.clearFilters')}
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={t('pipeline.emptyTitle')}
            description={t('pipeline.emptyDescription')}
          />
        )
      ) : null}

      {deals.length > 0 ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            role="region"
            aria-label={t('pipeline.title')}
            tabIndex={0}
            className="flex gap-3 overflow-x-auto pb-2"
          >
            {groups.map((group) => (
              <StageColumn
                key={group.stage}
                group={group}
                movingId={movingId}
                onMove={(deal, stage) => void moveDeal(deal, stage)}
              />
            ))}
          </div>
        </DndContext>
      ) : null}
    </section>
  );
}
