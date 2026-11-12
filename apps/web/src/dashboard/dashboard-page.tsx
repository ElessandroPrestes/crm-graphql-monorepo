import { useQuery } from '@apollo/client/react';
import {
  DashboardMetricsDocument,
  type DashboardMetricsQuery,
  type DashboardMetricsQueryVariables,
} from '@nexo/graphql-schema/operations';
import { useMemo, useState, type ReactElement } from 'react';
import { stageTone } from '../contacts/contact-utils';
import { normalizeApolloError } from '../graphql/errors';
import { useI18n } from '../i18n/i18n-context';
import { formatCurrencyFromCents, formatDateTime, formatNumber } from '../i18n/messages';
import { Badge } from '../ui/badge';
import { ErrorState, EmptyState, LoadingState } from '../ui/states';

type PeriodOption = 'all' | '7' | '30';

function periodVariables(period: PeriodOption): DashboardMetricsQueryVariables {
  if (period === 'all') {
    return {};
  }

  const end = new Date();
  const start = new Date(end.getTime() - Number(period) * 24 * 60 * 60 * 1000);

  return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

function MetricCard({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="space-y-1 rounded-[var(--radius-panel)] border border-[var(--color-border)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function DashboardPage(): ReactElement {
  const { t } = useI18n();
  const [period, setPeriod] = useState<PeriodOption>('all');
  const variables = useMemo(() => periodVariables(period), [period]);
  const { data, loading, error, refetch } = useQuery<
    DashboardMetricsQuery,
    DashboardMetricsQueryVariables
  >(DashboardMetricsDocument, { variables, fetchPolicy: 'cache-and-network' });
  const metrics = data?.dashboardMetrics;
  const normalizedError = error ? normalizeApolloError(error) : null;
  const isEmpty =
    metrics !== undefined &&
    metrics.openDeals === 0 &&
    metrics.wonDeals === 0 &&
    metrics.lostDeals === 0;

  return (
    <section aria-labelledby="page-title" className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-[var(--color-text-muted)]">{t('dashboard.description')}</p>
        </div>

        <div>
          <label htmlFor="dashboard-period" className="mb-1 block text-sm font-medium">
            {t('dashboard.period')}
          </label>
          <select
            id="dashboard-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value as PeriodOption)}
            className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <option value="all">{t('dashboard.periodAll')}</option>
            <option value="7">{t('dashboard.period7')}</option>
            <option value="30">{t('dashboard.period30')}</option>
          </select>
        </div>
      </header>

      {loading && !metrics ? <LoadingState label={t('dashboard.loading')} /> : null}

      {normalizedError && !metrics ? (
        <ErrorState
          message={
            normalizedError.kind === 'network' ? t('common.networkError') : t('dashboard.error')
          }
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      ) : null}

      {metrics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label={t('dashboard.openDeals')}
              value={`${formatNumber(metrics.openDeals)} · ${formatCurrencyFromCents(metrics.openValueCents)}`}
            />
            <MetricCard
              label={t('dashboard.wonDeals')}
              value={`${formatNumber(metrics.wonDeals)} · ${formatCurrencyFromCents(metrics.wonValueCents)}`}
            />
            <MetricCard
              label={t('dashboard.lostDeals')}
              value={`${formatNumber(metrics.lostDeals)} · ${formatCurrencyFromCents(metrics.lostValueCents)}`}
            />
          </div>

          {isEmpty ? (
            <EmptyState title={t('dashboard.empty')} description={t('dashboard.description')} />
          ) : (
            <section aria-labelledby="dashboard-stages-title" className="space-y-3">
              <h2 id="dashboard-stages-title" className="text-xl font-semibold">
                {t('dashboard.byStage')}
              </h2>
              <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)]">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <caption className="sr-only">{t('dashboard.byStage')}</caption>
                  <thead className="bg-[var(--color-surface-muted)]">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">
                        {t('dashboard.stage')}
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        {t('dashboard.count')}
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        {t('dashboard.value')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.stages.map((stage) => (
                      <tr key={stage.stage} className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-3">
                          <Badge tone={stageTone(stage.stage)}>{t(`stage.${stage.stage}`)}</Badge>
                        </td>
                        <td className="px-4 py-3">{formatNumber(stage.count)}</td>
                        <td className="px-4 py-3">{formatCurrencyFromCents(stage.valueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <p className="text-xs text-[var(--color-text-muted)]">
            {t('dashboard.generatedAt', {
              date: formatDateTime(String(metrics.generatedAt)),
            })}
          </p>
        </>
      ) : null}
    </section>
  );
}
