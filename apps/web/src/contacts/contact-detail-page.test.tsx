import {
  ActivitiesByContactDocument,
  ContactDetailDocument,
  ConversationsByContactDocument,
  DealsByContactDocument,
  DeleteContactDocument,
  ExportContactDataDocument,
} from '@nexo/graphql-schema/operations';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactDetailPage } from '../contacts/contact-detail-page';
import {
  activityPage,
  contact,
  conversationPage,
  deal,
  dealPage,
  emptyPage,
  message,
} from '../test/fixtures';
import { renderPage } from '../test/render-page';

const detailRoutes = (
  <Routes>
    <Route path="/contacts" element={<p>Lista de contatos</p>} />
    <Route path="/contacts/:contactId" element={<ContactDetailPage />} />
  </Routes>
);

function detailMocks() {
  return [
    {
      request: { query: ContactDetailDocument, variables: { id: contact.id } },
      result: { data: { contact } },
    },
    {
      request: {
        query: DealsByContactDocument,
        variables: { contactId: contact.id, first: 50 },
      },
      result: { data: { deals: dealPage } },
    },
    {
      request: {
        query: ActivitiesByContactDocument,
        variables: { contactId: contact.id, first: 50 },
      },
      result: { data: { activities: activityPage } },
    },
    {
      request: {
        query: ConversationsByContactDocument,
        variables: { contactId: contact.id, first: 50 },
      },
      result: { data: { conversations: conversationPage } },
    },
  ];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContactDetailPage', () => {
  it('shows profile, deals, activities and conversations for an authorized contact', async () => {
    renderPage(detailRoutes, {
      mocks: detailMocks(),
      initialEntries: [`/contacts/${contact.id}`],
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: /ana silva/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /negócios/i })).toBeInTheDocument();
    expect(screen.getByText('Implantação Initech')).toBeInTheDocument();
    expect(screen.getByText('Ligação de descoberta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir conversa/i })).toHaveAttribute(
      'href',
      '/inbox/conversation-1',
    );
  });

  it('shows empty states when the contact has no related data', async () => {
    renderPage(detailRoutes, {
      mocks: [
        {
          request: { query: ContactDetailDocument, variables: { id: contact.id } },
          result: { data: { contact } },
        },
        {
          request: {
            query: DealsByContactDocument,
            variables: { contactId: contact.id, first: 50 },
          },
          result: { data: { deals: emptyPage } },
        },
        {
          request: {
            query: ActivitiesByContactDocument,
            variables: { contactId: contact.id, first: 50 },
          },
          result: { data: { activities: emptyPage } },
        },
        {
          request: {
            query: ConversationsByContactDocument,
            variables: { contactId: contact.id, first: 50 },
          },
          result: { data: { conversations: emptyPage } },
        },
      ],
      initialEntries: [`/contacts/${contact.id}`],
    });

    expect(await screen.findByText(/nenhum negócio para este contato/i)).toBeInTheDocument();
    expect(await screen.findByText(/nenhuma atividade registrada/i)).toBeInTheDocument();
    expect(await screen.findByText(/nenhuma conversa com este contato/i)).toBeInTheDocument();
  });

  it('shows not found for an unauthorized or missing contact', async () => {
    renderPage(detailRoutes, {
      mocks: [
        {
          request: { query: ContactDetailDocument, variables: { id: 'missing' } },
          result: {
            errors: [{ message: 'Contato não encontrado', extensions: { code: 'NOT_FOUND' } }],
          },
        },
      ],
      initialEntries: ['/contacts/missing'],
    });

    expect(
      await screen.findByRole('heading', { name: /contato não encontrado/i }),
    ).toBeInTheDocument();
  });

  it('exports the contact data as JSON', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:contact');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    renderPage(detailRoutes, {
      mocks: [
        ...detailMocks(),
        {
          request: { query: ExportContactDataDocument, variables: { id: contact.id } },
          result: {
            data: {
              exportContactData: {
                exportedAt: '2026-05-05T12:00:00.000Z',
                contact,
                company: contact.company,
                deals: [deal],
                activities: [],
                conversations: [
                  {
                    conversation: {
                      id: 'conversation-1',
                      contactId: contact.id,
                      accountId: 'account-1',
                      channel: 'WHATSAPP',
                      lastMessageAt: '2026-05-04T12:00:00.000Z',
                      createdAt: '2026-05-01T12:00:00.000Z',
                      updatedAt: '2026-05-04T12:00:00.000Z',
                      ownerId: 'user-1',
                    },
                    messages: [message],
                  },
                ],
              },
            },
          },
        },
      ],
      initialEntries: [`/contacts/${contact.id}`],
    });

    await screen.findByRole('heading', { level: 1, name: /ana silva/i });
    await user.click(screen.getByRole('button', { name: /exportar dados/i }));

    expect(await screen.findByText(/exportação concluída/i)).toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const user = userEvent.setup();

    renderPage(detailRoutes, {
      mocks: detailMocks(),
      initialEntries: [`/contacts/${contact.id}`],
    });

    await screen.findByRole('heading', { level: 1, name: /ana silva/i });
    await user.click(screen.getByRole('button', { name: /excluir contato/i }));
    expect(screen.getByRole('dialog', { name: /excluir ana silva/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { level: 1, name: /ana silva/i })).toBeInTheDocument();
  });

  it('deletes the contact and returns to the contact list', async () => {
    const user = userEvent.setup();

    renderPage(detailRoutes, {
      mocks: [
        ...detailMocks(),
        {
          request: { query: DeleteContactDocument, variables: { id: contact.id } },
          result: { data: { deleteContact: true } },
        },
      ],
      initialEntries: [`/contacts/${contact.id}`],
    });

    await screen.findByRole('heading', { level: 1, name: /ana silva/i });
    await user.click(screen.getByRole('button', { name: /excluir contato/i }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^excluir contato$/i }),
    );

    expect(await screen.findByText(/lista de contatos/i)).toBeInTheDocument();
  });
});
