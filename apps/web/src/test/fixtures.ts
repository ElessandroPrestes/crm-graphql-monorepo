export const company = {
  __typename: 'Company',
  id: 'company-1',
  name: 'Initech',
  industry: null,
  domain: null,
};

export const contact = {
  __typename: 'Contact',
  id: 'contact-1',
  firstName: 'Ana',
  lastName: 'Silva',
  email: 'ana@initech.local',
  phone: '+55 11 90000-0001',
  jobTitle: 'Gerente',
  companyId: company.id,
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-02T12:00:00.000Z',
  company,
};

export const contactEdge = { cursor: 'cursor-contact-1', node: contact };

export const contactPage = {
  edges: [contactEdge],
  pageInfo: { hasNextPage: false, endCursor: 'cursor-contact-1' },
};

export const deal = {
  __typename: 'Deal',
  id: 'deal-1',
  title: 'Implantação Initech',
  stage: 'LEAD',
  valueCents: 150000,
  expectedCloseDate: '2026-06-01T12:00:00.000Z',
  closedAt: null,
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-02T12:00:00.000Z',
  version: 1,
  companyId: company.id,
  contactId: contact.id,
  contact: {
    __typename: 'Contact',
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
  },
  company,
};

export const dealEdge = { cursor: 'cursor-deal-1', node: deal };

export const dealPage = {
  edges: [dealEdge],
  pageInfo: { hasNextPage: false, endCursor: 'cursor-deal-1' },
};

export const activity = {
  __typename: 'Activity',
  id: 'activity-1',
  type: 'CALL',
  subject: 'Ligação de descoberta',
  notes: 'Cliente quer proposta.',
  occurredAt: '2026-05-03T12:00:00.000Z',
  contactId: contact.id,
  dealId: null,
  ownerId: 'user-1',
  createdAt: '2026-05-03T12:00:00.000Z',
};

export const activityEdge = { cursor: 'cursor-activity-1', node: activity };

export const activityPage = {
  edges: [activityEdge],
  pageInfo: { hasNextPage: false, endCursor: 'cursor-activity-1' },
};

export const conversation = {
  __typename: 'Conversation',
  id: 'conversation-1',
  contactId: contact.id,
  lastMessageAt: '2026-05-04T12:00:00.000Z',
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-04T12:00:00.000Z',
  contact: {
    __typename: 'Contact',
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
  },
};

export const conversationEdge = { cursor: 'cursor-conversation-1', node: conversation };

export const conversationPage = {
  edges: [conversationEdge],
  pageInfo: { hasNextPage: false, endCursor: 'cursor-conversation-1' },
};

export const message = {
  __typename: 'Message',
  id: 'message-1',
  conversationId: conversation.id,
  body: 'Olá, tudo bem?',
  direction: 'OUTBOUND',
  status: 'SENT',
  clientMessageId: 'client-message-1',
  externalId: 'external-1',
  sentAt: '2026-05-04T12:00:00.000Z',
  createdAt: '2026-05-04T12:00:00.000Z',
  errorCode: null,
};

export const messageEdge = { cursor: 'cursor-message-1', node: message };

export const messagePage = {
  edges: [messageEdge],
  pageInfo: { hasNextPage: false, endCursor: 'cursor-message-1' },
};

export const emptyPage = {
  edges: [],
  pageInfo: { hasNextPage: false, endCursor: null },
};
