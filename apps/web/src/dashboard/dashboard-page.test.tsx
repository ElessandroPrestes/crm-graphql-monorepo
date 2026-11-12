import { DashboardMetricsDocument } from '@nexo/graphql-schema/operations';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DashboardPage } from '../dashboard/dashboard-page';
import { renderPage } from '../test/render-page';

const metrics = {
  dashboardMetrics: {
    generatedAt: '2026-05-05T12:00:00.000Z',
    openDeals: 3,
    openValueCents: 450000,
    wonDeals: 2,
    wonValueCents: 500000,
    lostDeals: 1,
    lostValueCents: 100000,
    stages: [
      { stage: 'LEAD', count: 1, valueCents: 150000 },
      { stage: 'QUALIFIED', count: 2, valueCents: 300000 },
    ],
  },
};

function metricsMock(
  variables: (values: Record<string, unknown>) => boolean,
  data: unknown = metrics,
) {
  return {
    request: { query: DashboardMetricsDocument, variables },
    result: { data },
  };
}

describe('DashboardPage', () => {
  it('shows metrics and the stage breakdown', async () => {
    renderPage(<DashboardPage />, {
      mocks: [metricsMock((variables) => !variables.periodStart)],
      initialEntries: ['/dashboard'],
    });

    expect(await screen.findByText(/negócios abertos/i)).toBeInTheDocument();
    expect(screen.getByText(/3 · R\$\s?4\.500,00/)).toBeInTheDocument();
    expect(screen.getByText(/2 · R\$\s?5\.000,00/)).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /lead\s+1\s+R\$\s?1\.500,00/i })).toBeInTheDocument();
    expect(screen.getByText(/gerado em/i)).toBeInTheDocument();
  });

  it('reloads metrics when the period changes', async () => {
    const user = userEvent.setup();

    renderPage(<DashboardPage />, {
      mocks: [
        metricsMock((variables) => !variables.periodStart),
        metricsMock(
          (variables) =>
            typeof variables.periodStart === 'string' && typeof variables.periodEnd === 'string',
          {
            dashboardMetrics: {
              ...metrics.dashboardMetrics,
              wonDeals: 9,
              wonValueCents: 900000,
            },
          },
        ),
      ],
      initialEntries: ['/dashboard'],
    });

    expect(await screen.findByText(/negócios abertos/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/período/i), '7');

    expect(await screen.findByText(/9 · R\$\s?9\.000,00/)).toBeInTheDocument();
  });

  it('explains when there are no deals in the period', async () => {
    renderPage(<DashboardPage />, {
      mocks: [
        metricsMock((variables) => !variables.periodStart, {
          dashboardMetrics: {
            ...metrics.dashboardMetrics,
            openDeals: 0,
            openValueCents: 0,
            wonDeals: 0,
            wonValueCents: 0,
            lostDeals: 0,
            lostValueCents: 0,
            stages: [],
          },
        }),
      ],
      initialEntries: ['/dashboard'],
    });

    expect(await screen.findByText(/ainda não há negócios no período/i)).toBeInTheDocument();
  });
});
