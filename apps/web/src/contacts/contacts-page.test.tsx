import {
  CompaniesListDocument,
  ContactsListDocument,
  CreateContactDocument,
} from '@nexo/graphql-schema/operations';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ContactsPage } from '../contacts/contacts-page';
import { contactPage, emptyPage } from '../test/fixtures';
import { renderPage } from '../test/render-page';

const companiesData = {
  companies: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
};

function contactsMock(
  matcher: (variables: Record<string, unknown>) => boolean,
  data: unknown,
  maxUsageCount = 1,
) {
  return {
    request: { query: ContactsListDocument, variables: matcher },
    result: { data },
    maxUsageCount,
  };
}

const companiesMock = {
  request: { query: CompaniesListDocument, variables: { first: 100 } },
  result: { data: companiesData },
};

describe('ContactsPage', () => {
  it('lists authorized contacts with name, e-mail and company', async () => {
    renderPage(<ContactsPage />, {
      mocks: [
        contactsMock((variables) => variables.first === 20, { contacts: contactPage }, 3),
        companiesMock,
      ],
      initialEntries: ['/contacts'],
    });

    expect(
      await screen.findByRole('link', { name: /abrir contato ana silva/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('ana@initech.local')).toBeInTheDocument();
    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('retries a recoverable list error', async () => {
    const user = userEvent.setup();

    renderPage(<ContactsPage />, {
      mocks: [
        {
          request: {
            query: ContactsListDocument,
            variables: (variables: Record<string, unknown>) => variables.first === 20,
          },
          error: new Error('Failed to fetch'),
        },
        contactsMock((variables) => variables.first === 20, { contacts: contactPage }),
        companiesMock,
      ],
      initialEntries: ['/contacts'],
    });

    expect(await screen.findByText(/não foi possível conectar ao servidor/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(
      await screen.findByRole('link', { name: /abrir contato ana silva/i }),
    ).toBeInTheDocument();
  });

  it('searches on the server after debounce', async () => {
    const user = userEvent.setup();

    renderPage(<ContactsPage />, {
      mocks: [
        contactsMock((variables) => variables.first === 20 && !variables.search, {
          contacts: contactPage,
        }),
        contactsMock((variables) => variables.search === 'Carla', {
          contacts: {
            edges: [
              {
                cursor: 'carla',
                node: {
                  ...contactPage.edges[0]?.node,
                  id: 'contact-2',
                  firstName: 'Carla',
                  lastName: 'Souza',
                  email: 'carla@globex.local',
                },
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: 'carla' },
          },
        }),
        companiesMock,
      ],
      initialEntries: ['/contacts'],
    });

    await screen.findByRole('link', { name: /abrir contato ana silva/i });
    await user.type(screen.getByLabelText(/buscar contatos/i), 'Carla');

    expect(
      await screen.findByRole('link', { name: /abrir contato carla souza/i }, { timeout: 2000 }),
    ).toBeInTheDocument();
  });

  it('distinguishes empty results from a filter without matches', async () => {
    renderPage(<ContactsPage />, {
      mocks: [
        contactsMock((variables) => variables.search === 'zzz', { contacts: emptyPage }),
        companiesMock,
      ],
      initialEntries: ['/contacts?search=zzz'],
    });

    expect(await screen.findByText(/nenhum contato encontrado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
  });

  it('validates the create form and focuses the first invalid field', async () => {
    const user = userEvent.setup();

    renderPage(<ContactsPage />, {
      mocks: [
        contactsMock((variables) => variables.first === 20 && !variables.search, {
          contacts: emptyPage,
        }),
        companiesMock,
      ],
      initialEntries: ['/contacts'],
    });

    await screen.findByText(/nenhum contato cadastrado/i);
    await user.click(screen.getAllByRole('button', { name: /novo contato/i })[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: /criar contato/i }));

    expect(await screen.findByText('Informe o nome.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveFocus();
  });

  it('creates a contact, closes the dialog and refreshes the list', async () => {
    const user = userEvent.setup();
    const created = {
      ...contactPage.edges[0]?.node,
      id: 'contact-new',
      firstName: 'Ana',
      lastName: 'Souza',
      email: 'ana.souza@initech.local',
    };

    renderPage(<ContactsPage />, {
      mocks: [
        contactsMock((variables) => variables.first === 20 && !variables.search, {
          contacts: emptyPage,
        }),
        {
          request: {
            query: CreateContactDocument,
            variables: (variables: Record<string, unknown>) => {
              const input = variables.input as Record<string, unknown>;
              return input.firstName === 'Ana' && input.lastName === 'Souza';
            },
          },
          result: { data: { createContact: created } },
        },
        contactsMock((variables) => variables.first === 20 && !variables.search, {
          contacts: {
            edges: [{ cursor: 'new', node: created }],
            pageInfo: { hasNextPage: false, endCursor: 'new' },
          },
        }),
        companiesMock,
      ],
      initialEntries: ['/contacts'],
    });

    await screen.findByText(/nenhum contato cadastrado/i);
    await user.click(screen.getAllByRole('button', { name: /novo contato/i })[0] as HTMLElement);
    await user.type(screen.getByLabelText('Nome'), 'Ana');
    await user.type(screen.getByLabelText('Sobrenome'), 'Souza');
    await user.type(screen.getByLabelText(/e-mail/i), 'ana.souza@initech.local');
    await user.click(screen.getByRole('button', { name: /criar contato/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText(/contato criado com sucesso/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir contato ana souza/i })).toBeInTheDocument();
  });
});
