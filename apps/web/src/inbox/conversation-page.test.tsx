import {
  ConversationDetailDocument,
  ConversationsListDocument,
  MessageReceivedDocument,
  MessagesDocument,
  SendMessageDocument,
} from '@nexo/graphql-schema/operations';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { ConversationPage } from '../inbox/conversation-page';
import { conversation, conversationPage, emptyPage, message, messagePage } from '../test/fixtures';
import { renderPage } from '../test/render-page';

const conversationRoutes = (
  <Routes>
    <Route path="/inbox" element={<p>Inbox</p>} />
    <Route path="/inbox/:conversationId" element={<ConversationPage />} />
  </Routes>
);

function baseMocks() {
  return [
    {
      request: { query: ConversationDetailDocument, variables: { id: conversation.id } },
      result: { data: { conversation } },
    },
    {
      request: { query: ConversationsListDocument, variables: { first: 20 } },
      result: { data: { conversations: conversationPage } },
    },
  ];
}

function silentSubscriptionMock() {
  return {
    request: {
      query: MessageReceivedDocument,
      variables: { conversationId: conversation.id },
    },
    result: { data: { messageReceived: null } },
  };
}

function messagesMock(data: unknown) {
  return {
    request: {
      query: MessagesDocument,
      variables: (values: Record<string, unknown>) =>
        values.conversationId === conversation.id && values.first === 30,
    },
    result: { data },
  };
}

describe('ConversationPage', () => {
  it('sends a message, shows the pending id and keeps focus in the composer', async () => {
    const user = userEvent.setup();
    let clientMessageId: string | undefined;

    renderPage(conversationRoutes, {
      mocks: [
        ...baseMocks(),
        silentSubscriptionMock(),
        messagesMock({ messages: emptyPage }),
        {
          request: {
            query: SendMessageDocument,
            variables: (variables: Record<string, unknown>) => {
              const input = variables.input as Record<string, unknown>;
              clientMessageId = input.clientMessageId as string;
              return input.conversationId === conversation.id && input.text === 'Mensagem nova';
            },
          },
          result: {
            data: {
              sendMessage: {
                ...message,
                id: 'message-2',
                body: 'Mensagem nova',
                clientMessageId: null,
              },
            },
          },
        },
        messagesMock({
          messages: {
            edges: [
              {
                cursor: 'message-2',
                node: { ...message, id: 'message-2', body: 'Mensagem nova', clientMessageId: null },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'message-2' },
          },
        }),
      ],
      initialEntries: [`/inbox/${conversation.id}`],
    });

    expect(await screen.findByRole('heading', { name: 'Ana Silva' })).toBeInTheDocument();
    expect(await screen.findByText(/nenhuma mensagem ainda/i)).toBeInTheDocument();
    const composer = screen.getByLabelText(/mensagem$/i);
    await user.type(composer, 'Mensagem nova');
    await user.click(screen.getByRole('button', { name: /^enviar$/i }));

    expect(await screen.findByText('Mensagem nova', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(clientMessageId).toMatch(/^[a-zA-Z0-9-]{8,}$/);
    expect(composer).toHaveFocus();
  });

  it('marks a failed message and retries with the same client message id', async () => {
    const user = userEvent.setup();
    const sentClientIds: string[] = [];

    renderPage(conversationRoutes, {
      mocks: [
        ...baseMocks(),
        silentSubscriptionMock(),
        messagesMock({ messages: emptyPage }),
        {
          request: {
            query: SendMessageDocument,
            variables: (variables: Record<string, unknown>) => {
              const input = variables.input as Record<string, unknown>;
              sentClientIds.push(String(input.clientMessageId));
              return input.text === 'Vai falhar';
            },
          },
          result: { errors: [{ message: 'Falha temporária' }] },
        },
        {
          request: {
            query: SendMessageDocument,
            variables: (variables: Record<string, unknown>) => {
              const input = variables.input as Record<string, unknown>;
              sentClientIds.push(String(input.clientMessageId));
              return input.text === 'Vai falhar';
            },
          },
          result: {
            data: {
              sendMessage: {
                ...message,
                id: 'message-3',
                body: 'Vai falhar',
                clientMessageId: null,
              },
            },
          },
        },
        messagesMock({
          messages: {
            edges: [
              {
                cursor: 'message-3',
                node: { ...message, id: 'message-3', body: 'Vai falhar', clientMessageId: null },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'message-3' },
          },
        }),
      ],
      initialEntries: [`/inbox/${conversation.id}`],
    });

    expect(await screen.findByRole('heading', { name: 'Ana Silva' })).toBeInTheDocument();
    expect(await screen.findByText(/nenhuma mensagem ainda/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/mensagem$/i), 'Vai falhar');
    await user.click(screen.getByRole('button', { name: /^enviar$/i }));

    expect(await screen.findByText(/falha ao enviar/i, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('Falhou')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reenviar/i }));

    expect(await screen.findByText('Vai falhar', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(sentClientIds).toHaveLength(2);
    expect(sentClientIds[0]).toBe(sentClientIds[1]);
    expect(sentClientIds[0]).toMatch(/^[a-zA-Z0-9-]{8,}$/);
  });

  it('announces an incoming realtime message without stealing focus', async () => {
    const incoming = {
      ...message,
      id: 'message-4',
      body: 'Chegou agora',
      direction: 'INBOUND',
      status: 'RECEIVED',
      clientMessageId: null,
    };

    renderPage(conversationRoutes, {
      mocks: [
        ...baseMocks(),
        messagesMock({ messages: messagePage }),
        {
          request: {
            query: MessageReceivedDocument,
            variables: { conversationId: conversation.id },
          },
          result: { data: { messageReceived: incoming } },
          delay: 800,
        },
        messagesMock({
          messages: {
            edges: [
              { cursor: 'message-1', node: message },
              { cursor: 'message-4', node: incoming },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'message-4' },
          },
        }),
      ],
      initialEntries: [`/inbox/${conversation.id}`],
    });

    expect(await screen.findByText('Olá, tudo bem?')).toBeInTheDocument();
    const composer = screen.getByLabelText(/mensagem$/i);
    composer.focus();
    expect(composer).toHaveFocus();

    expect(
      await screen.findByText(/nova mensagem de/i, { selector: 'p' }, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Chegou agora')).toBeInTheDocument();
    expect(composer).toHaveFocus();
  });

  it('shows the reconnection state without losing the history', async () => {
    renderPage(conversationRoutes, {
      mocks: [
        ...baseMocks(),
        messagesMock({ messages: messagePage }),
        {
          request: {
            query: MessageReceivedDocument,
            variables: { conversationId: conversation.id },
          },
          error: new Error('socket closed'),
        },
      ],
      initialEntries: [`/inbox/${conversation.id}`],
    });

    expect(await screen.findByText('Olá, tudo bem?')).toBeInTheDocument();
    expect(await screen.findByText(/conexão em tempo real perdida/i)).toBeInTheDocument();
    expect(screen.getByText('Olá, tudo bem?')).toBeInTheDocument();
  });
});
