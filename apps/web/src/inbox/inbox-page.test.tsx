import { ConversationsListDocument } from '@nexo/graphql-schema/operations';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InboxPage } from '../inbox/inbox-page';
import { conversationPage, emptyPage } from '../test/fixtures';
import { renderPage } from '../test/render-page';

function conversationsMock(variables: (values: Record<string, unknown>) => boolean, data: unknown) {
  return {
    request: { query: ConversationsListDocument, variables },
    result: { data },
  };
}

describe('InboxPage', () => {
  it('lists conversations for the current portfolio', async () => {
    renderPage(<InboxPage />, {
      mocks: [
        conversationsMock((variables) => variables.first === 20 && !variables.search, {
          conversations: conversationPage,
        }),
      ],
      initialEntries: ['/inbox'],
    });

    expect(
      await screen.findByRole('link', { name: /abrir conversa com ana silva/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('+55 11 90000-0001')).toBeInTheDocument();
  });

  it('distinguishes an empty inbox from a search without matches', async () => {
    renderPage(<InboxPage />, {
      mocks: [
        conversationsMock((variables) => variables.first === 20 && !variables.search, {
          conversations: emptyPage,
        }),
      ],
      initialEntries: ['/inbox'],
    });

    expect(await screen.findByText(/nenhuma conversa$/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument();
  });

  it('searches conversations on the server after debounce', async () => {
    const user = userEvent.setup();

    renderPage(<InboxPage />, {
      mocks: [
        conversationsMock((variables) => variables.first === 20 && !variables.search, {
          conversations: conversationPage,
        }),
        conversationsMock((variables) => variables.search === 'zzz', { conversations: emptyPage }),
      ],
      initialEntries: ['/inbox'],
    });

    await screen.findByRole('link', { name: /abrir conversa com ana silva/i });
    await user.type(screen.getByLabelText(/buscar conversas/i), 'zzz');

    expect(
      await screen.findByText(/nenhuma conversa encontrada/i, {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
  });
});
