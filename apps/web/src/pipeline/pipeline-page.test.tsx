import {
  CompaniesListDocument,
  DashboardMetricsDocument,
  PipelineDealsDocument,
  UpdateDealDocument,
} from '@nexo/graphql-schema/operations';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PipelinePage } from '../pipeline/pipeline-page';
import { deal, emptyPage } from '../test/fixtures';
import { renderPage } from '../test/render-page';

const stages = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];

const metrics = {
  dashboardMetrics: {
    generatedAt: '2026-05-05T12:00:00.000Z',
    openDeals: 1,
    openValueCents: deal.valueCents,
    wonDeals: 2,
    wonValueCents: 500000,
    lostDeals: 1,
    lostValueCents: 100000,
    stages: [],
  },
};

const companiesData = {
  companies: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
};

function pipelineMock(data: unknown, maxUsageCount = 1) {
  return {
    request: {
      query: PipelineDealsDocument,
      variables: (variables: Record<string, unknown>) =>
        variables.first === 100 && JSON.stringify(variables.stages) === JSON.stringify(stages),
    },
    result: { data },
    maxUsageCount,
  };
}

function metricsMock(maxUsageCount = 1, data: unknown = metrics) {
  return {
    request: {
      query: DashboardMetricsDocument,
      variables: (variables: Record<string, unknown>) => !variables.periodStart,
    },
    result: { data },
    maxUsageCount,
  };
}

const companiesMock = {
  request: { query: CompaniesListDocument, variables: { first: 100 } },
  result: { data: companiesData },
};

describe('PipelinePage', () => {
  it('groups authorized deals by stage with count and total', async () => {
    renderPage(<PipelinePage />, {
      mocks: [
        pipelineMock({
          deals: {
            edges: [{ cursor: 'd1', node: deal }],
            pageInfo: { hasNextPage: false, endCursor: 'd1' },
          },
        }),
        metricsMock(),
        companiesMock,
      ],
      initialEntries: ['/pipeline'],
    });

    expect(await screen.findByRole('heading', { name: /lead/i })).toBeInTheDocument();
    expect(screen.getByText('Implantação Initech')).toBeInTheDocument();
    expect(screen.getByText(/1 negócios · R\$\s?1\.500,00/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /qualificado/i })).toBeInTheDocument();
    expect(screen.getByText(/2 · R\$\s?5\.000,00/)).toBeInTheDocument();
  });

  it('moves a deal through the keyboard menu with expectedVersion', async () => {
    const user = userEvent.setup();
    let capturedInput: Record<string, unknown> | undefined;
    const moved = { ...deal, stage: 'QUALIFIED', version: 2 };

    renderPage(<PipelinePage />, {
      mocks: [
        pipelineMock({
          deals: {
            edges: [{ cursor: 'd1', node: deal }],
            pageInfo: { hasNextPage: false, endCursor: 'd1' },
          },
        }),
        pipelineMock({
          deals: {
            edges: [{ cursor: 'd1', node: moved }],
            pageInfo: { hasNextPage: false, endCursor: 'd1' },
          },
        }),
        metricsMock(),
        metricsMock(1, {
          dashboardMetrics: {
            ...metrics.dashboardMetrics,
            wonDeals: 3,
            wonValueCents: 650000,
          },
        }),
        companiesMock,
        {
          request: {
            query: UpdateDealDocument,
            variables: (variables: Record<string, unknown>) => {
              const input = variables.input as Record<string, unknown>;
              capturedInput = input;
              return variables.id === deal.id;
            },
          },
          result: { data: { updateDeal: moved } },
        },
      ],
      initialEntries: ['/pipeline'],
    });

    await screen.findByText('Implantação Initech');
    await user.click(screen.getByText('Mover para…'));
    await user.click(screen.getByRole('button', { name: /mover para qualificado/i }));

    expect(await screen.findByText(/negócio movido para qualificado/i)).toBeInTheDocument();
    expect(capturedInput?.stage).toBe('QUALIFIED');
    expect(capturedInput?.expectedVersion).toBe(1);
    expect(await screen.findByText(/3 · R\$\s?6\.500,00/)).toBeInTheDocument();
  });

  it('reloads the board and explains a version conflict', async () => {
    const user = userEvent.setup();

    renderPage(<PipelinePage />, {
      mocks: [
        pipelineMock({
          deals: {
            edges: [{ cursor: 'd1', node: deal }],
            pageInfo: { hasNextPage: false, endCursor: 'd1' },
          },
        }),
        pipelineMock({
          deals: {
            edges: [{ cursor: 'd1', node: deal }],
            pageInfo: { hasNextPage: false, endCursor: 'd1' },
          },
        }),
        metricsMock(),
        metricsMock(1, {
          dashboardMetrics: {
            ...metrics.dashboardMetrics,
            wonDeals: 3,
            wonValueCents: 650000,
          },
        }),
        companiesMock,
        {
          request: {
            query: UpdateDealDocument,
            variables: (variables: Record<string, unknown>) => variables.id === deal.id,
          },
          result: {
            errors: [
              {
                message: 'Versão desatualizada',
                extensions: { code: 'CONFLICT' },
              },
            ],
          },
        },
      ],
      initialEntries: ['/pipeline'],
    });

    await screen.findByText('Implantação Initech');
    await user.click(screen.getByText('Mover para…'));
    await user.click(screen.getByRole('button', { name: /mover para qualificado/i }));

    expect(await screen.findByText(/atualizado por outra pessoa/i)).toBeInTheDocument();
  });

  it('shows a clear action when filtered by a contact', async () => {
    renderPage(<PipelinePage />, {
      mocks: [
        {
          request: {
            query: PipelineDealsDocument,
            variables: (variables: Record<string, unknown>) => variables.contactId === 'contact-1',
          },
          result: { data: { deals: emptyPage } },
        },
        metricsMock(),
        companiesMock,
      ],
      initialEntries: ['/pipeline?contactId=contact-1'],
    });

    expect(await screen.findByText(/filtrado por um contato específico/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
    });
  });
});
