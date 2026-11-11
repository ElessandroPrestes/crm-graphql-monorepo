export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: unknown; output: unknown; }
};

export type Activity = {
  readonly __typename?: 'Activity';
  readonly contact?: Maybe<Contact>;
  readonly contactId?: Maybe<Scalars['ID']['output']>;
  readonly createdAt: Scalars['DateTime']['output'];
  readonly deal?: Maybe<Deal>;
  readonly dealId?: Maybe<Scalars['ID']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly notes?: Maybe<Scalars['String']['output']>;
  readonly occurredAt: Scalars['DateTime']['output'];
  readonly ownerId: Scalars['ID']['output'];
  readonly subject: Scalars['String']['output'];
  readonly type: ActivityType;
};

export type ActivityConnection = {
  readonly __typename?: 'ActivityConnection';
  readonly edges: ReadonlyArray<ActivityEdge>;
  readonly pageInfo: PageInfoType;
};

export type ActivityEdge = {
  readonly __typename?: 'ActivityEdge';
  readonly cursor: Scalars['String']['output'];
  readonly node: Activity;
};

/** Tipos de interação registrados na linha do tempo. */
export enum ActivityType {
  Call = 'CALL',
  Email = 'EMAIL',
  Meeting = 'MEETING',
  Note = 'NOTE'
}

export type Company = {
  readonly __typename?: 'Company';
  readonly createdAt: Scalars['DateTime']['output'];
  readonly domain?: Maybe<Scalars['String']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly industry?: Maybe<Scalars['String']['output']>;
  readonly name: Scalars['String']['output'];
  readonly ownerId: Scalars['ID']['output'];
  readonly updatedAt: Scalars['DateTime']['output'];
};

export type CompanyConnection = {
  readonly __typename?: 'CompanyConnection';
  readonly edges: ReadonlyArray<CompanyEdge>;
  readonly pageInfo: PageInfoType;
};

export type CompanyEdge = {
  readonly __typename?: 'CompanyEdge';
  readonly cursor: Scalars['String']['output'];
  readonly node: Company;
};

export type Contact = {
  readonly __typename?: 'Contact';
  readonly company?: Maybe<Company>;
  readonly companyId?: Maybe<Scalars['ID']['output']>;
  readonly createdAt: Scalars['DateTime']['output'];
  readonly email?: Maybe<Scalars['String']['output']>;
  readonly firstName: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly jobTitle?: Maybe<Scalars['String']['output']>;
  readonly lastName: Scalars['String']['output'];
  readonly ownerId: Scalars['ID']['output'];
  readonly phone?: Maybe<Scalars['String']['output']>;
  readonly updatedAt: Scalars['DateTime']['output'];
};

export type ContactConnection = {
  readonly __typename?: 'ContactConnection';
  readonly edges: ReadonlyArray<ContactEdge>;
  readonly pageInfo: PageInfoType;
};

export type ContactDataExport = {
  readonly __typename?: 'ContactDataExport';
  readonly activities: ReadonlyArray<Activity>;
  readonly company?: Maybe<Company>;
  readonly contact: Contact;
  readonly conversations: ReadonlyArray<ConversationExportItem>;
  readonly deals: ReadonlyArray<Deal>;
  readonly exportedAt: Scalars['DateTime']['output'];
};

export type ContactEdge = {
  readonly __typename?: 'ContactEdge';
  readonly cursor: Scalars['String']['output'];
  readonly node: Contact;
};

export type Conversation = {
  readonly __typename?: 'Conversation';
  readonly accountId: Scalars['ID']['output'];
  readonly channel: WhatsAppChannel;
  readonly contact: Contact;
  readonly contactId: Scalars['ID']['output'];
  readonly createdAt: Scalars['DateTime']['output'];
  readonly id: Scalars['ID']['output'];
  readonly lastMessageAt: Scalars['DateTime']['output'];
  readonly ownerId: Scalars['ID']['output'];
  readonly updatedAt: Scalars['DateTime']['output'];
};

export type ConversationConnection = {
  readonly __typename?: 'ConversationConnection';
  readonly edges: ReadonlyArray<ConversationEdge>;
  readonly pageInfo: PageInfoType;
};

export type ConversationEdge = {
  readonly __typename?: 'ConversationEdge';
  readonly cursor: Scalars['String']['output'];
  readonly node: Conversation;
};

export type ConversationExportItem = {
  readonly __typename?: 'ConversationExportItem';
  readonly conversation: Conversation;
  readonly messages: ReadonlyArray<Message>;
};

export type CreateActivityInput = {
  readonly contactId?: InputMaybe<Scalars['ID']['input']>;
  readonly dealId?: InputMaybe<Scalars['ID']['input']>;
  readonly notes?: InputMaybe<Scalars['String']['input']>;
  readonly occurredAt: Scalars['DateTime']['input'];
  readonly subject: Scalars['String']['input'];
  readonly type: ActivityType;
};

export type CreateCompanyInput = {
  readonly domain?: InputMaybe<Scalars['String']['input']>;
  readonly industry?: InputMaybe<Scalars['String']['input']>;
  readonly name: Scalars['String']['input'];
};

export type CreateContactInput = {
  readonly companyId?: InputMaybe<Scalars['ID']['input']>;
  readonly email?: InputMaybe<Scalars['String']['input']>;
  readonly firstName: Scalars['String']['input'];
  readonly jobTitle?: InputMaybe<Scalars['String']['input']>;
  readonly lastName: Scalars['String']['input'];
  readonly phone?: InputMaybe<Scalars['String']['input']>;
};

export type CreateDealInput = {
  readonly companyId?: InputMaybe<Scalars['ID']['input']>;
  readonly contactId?: InputMaybe<Scalars['ID']['input']>;
  readonly expectedCloseDate?: InputMaybe<Scalars['DateTime']['input']>;
  readonly stage?: InputMaybe<DealStage>;
  readonly title: Scalars['String']['input'];
  readonly valueCents?: InputMaybe<Scalars['Int']['input']>;
};

export type DashboardMetrics = {
  readonly __typename?: 'DashboardMetrics';
  readonly generatedAt: Scalars['DateTime']['output'];
  readonly lostDeals: Scalars['Int']['output'];
  readonly lostValueCents: Scalars['Int']['output'];
  readonly openDeals: Scalars['Int']['output'];
  readonly openValueCents: Scalars['Int']['output'];
  readonly stages: ReadonlyArray<DealStageMetricType>;
  readonly wonDeals: Scalars['Int']['output'];
  readonly wonValueCents: Scalars['Int']['output'];
};

export type Deal = {
  readonly __typename?: 'Deal';
  readonly closedAt?: Maybe<Scalars['DateTime']['output']>;
  readonly company?: Maybe<Company>;
  readonly companyId?: Maybe<Scalars['ID']['output']>;
  readonly contact?: Maybe<Contact>;
  readonly contactId?: Maybe<Scalars['ID']['output']>;
  readonly createdAt: Scalars['DateTime']['output'];
  readonly expectedCloseDate?: Maybe<Scalars['DateTime']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly ownerId: Scalars['ID']['output'];
  readonly stage: DealStage;
  readonly title: Scalars['String']['output'];
  readonly updatedAt: Scalars['DateTime']['output'];
  readonly valueCents: Scalars['Int']['output'];
  readonly version: Scalars['Int']['output'];
};

export type DealConnection = {
  readonly __typename?: 'DealConnection';
  readonly edges: ReadonlyArray<DealEdge>;
  readonly pageInfo: PageInfoType;
};

export type DealEdge = {
  readonly __typename?: 'DealEdge';
  readonly cursor: Scalars['String']['output'];
  readonly node: Deal;
};

/** Etapas do funil de negociações. */
export enum DealStage {
  Lead = 'LEAD',
  Lost = 'LOST',
  Negotiation = 'NEGOTIATION',
  Proposal = 'PROPOSAL',
  Qualified = 'QUALIFIED',
  Won = 'WON'
}

export type DealStageMetricType = {
  readonly __typename?: 'DealStageMetricType';
  readonly count: Scalars['Int']['output'];
  readonly stage: DealStage;
  readonly valueCents: Scalars['Int']['output'];
};

export type Message = {
  readonly __typename?: 'Message';
  readonly body: Scalars['String']['output'];
  readonly clientMessageId?: Maybe<Scalars['String']['output']>;
  readonly conversationId: Scalars['ID']['output'];
  readonly createdAt: Scalars['DateTime']['output'];
  readonly direction: MessageDirection;
  readonly errorCode?: Maybe<Scalars['String']['output']>;
  readonly externalId?: Maybe<Scalars['String']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly sentAt: Scalars['DateTime']['output'];
  readonly status: MessageStatus;
};

export type MessageConnection = {
  readonly __typename?: 'MessageConnection';
  readonly edges: ReadonlyArray<MessageEdge>;
  readonly pageInfo: PageInfoType;
};

/** Direção da mensagem na conversa. */
export enum MessageDirection {
  Inbound = 'INBOUND',
  Outbound = 'OUTBOUND'
}

export type MessageEdge = {
  readonly __typename?: 'MessageEdge';
  readonly cursor: Scalars['String']['output'];
  readonly node: Message;
};

/** Estado de processamento ou envio da mensagem. */
export enum MessageStatus {
  Failed = 'FAILED',
  Queued = 'QUEUED',
  Received = 'RECEIVED',
  Sent = 'SENT'
}

export type Mutation = {
  readonly __typename?: 'Mutation';
  readonly createActivity: Activity;
  readonly createCompany: Company;
  readonly createContact: Contact;
  readonly createDeal: Deal;
  readonly deleteCompany: Scalars['Boolean']['output'];
  readonly deleteContact: Scalars['Boolean']['output'];
  readonly deleteDeal: Scalars['Boolean']['output'];
  readonly exportContactData: ContactDataExport;
  readonly sendMessage: Message;
  readonly updateCompany: Company;
  readonly updateContact: Contact;
  readonly updateDeal: Deal;
};


export type MutationCreateActivityArgs = {
  input: CreateActivityInput;
};


export type MutationCreateCompanyArgs = {
  input: CreateCompanyInput;
};


export type MutationCreateContactArgs = {
  input: CreateContactInput;
};


export type MutationCreateDealArgs = {
  input: CreateDealInput;
};


export type MutationDeleteCompanyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContactArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDealArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExportContactDataArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSendMessageArgs = {
  input: SendMessageInput;
};


export type MutationUpdateCompanyArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCompanyInput;
};


export type MutationUpdateContactArgs = {
  id: Scalars['ID']['input'];
  input: UpdateContactInput;
};


export type MutationUpdateDealArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDealInput;
};

export type PageInfoType = {
  readonly __typename?: 'PageInfoType';
  readonly endCursor?: Maybe<Scalars['String']['output']>;
  readonly hasNextPage: Scalars['Boolean']['output'];
};

export type Query = {
  readonly __typename?: 'Query';
  readonly activities: ActivityConnection;
  readonly companies: CompanyConnection;
  readonly company: Company;
  readonly contact: Contact;
  readonly contacts: ContactConnection;
  readonly conversation: Conversation;
  readonly conversations: ConversationConnection;
  readonly dashboardMetrics: DashboardMetrics;
  readonly deal: Deal;
  readonly deals: DealConnection;
  readonly me: User;
  readonly messages: MessageConnection;
};


export type QueryActivitiesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  contactId?: InputMaybe<Scalars['ID']['input']>;
  dealId?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCompaniesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCompanyArgs = {
  id: Scalars['ID']['input'];
};


export type QueryContactArgs = {
  id: Scalars['ID']['input'];
};


export type QueryContactsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryConversationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryConversationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDashboardMetricsArgs = {
  periodEnd?: InputMaybe<Scalars['DateTime']['input']>;
  periodStart?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryDealArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDealsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMessagesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  conversationId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type SendMessageInput = {
  readonly clientMessageId?: InputMaybe<Scalars['String']['input']>;
  readonly conversationId: Scalars['ID']['input'];
  readonly text: Scalars['String']['input'];
};

export type Subscription = {
  readonly __typename?: 'Subscription';
  readonly dealMoved: Deal;
  readonly messageReceived: Message;
};


export type SubscriptionDealMovedArgs = {
  dealId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionMessageReceivedArgs = {
  conversationId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateCompanyInput = {
  readonly domain?: InputMaybe<Scalars['String']['input']>;
  readonly industry?: InputMaybe<Scalars['String']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateContactInput = {
  readonly companyId?: InputMaybe<Scalars['ID']['input']>;
  readonly email?: InputMaybe<Scalars['String']['input']>;
  readonly firstName?: InputMaybe<Scalars['String']['input']>;
  readonly jobTitle?: InputMaybe<Scalars['String']['input']>;
  readonly lastName?: InputMaybe<Scalars['String']['input']>;
  readonly phone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDealInput = {
  readonly companyId?: InputMaybe<Scalars['ID']['input']>;
  readonly contactId?: InputMaybe<Scalars['ID']['input']>;
  readonly expectedCloseDate?: InputMaybe<Scalars['DateTime']['input']>;
  readonly expectedVersion: Scalars['Int']['input'];
  readonly stage?: InputMaybe<DealStage>;
  readonly title?: InputMaybe<Scalars['String']['input']>;
  readonly valueCents?: InputMaybe<Scalars['Int']['input']>;
};

export type User = {
  readonly __typename?: 'User';
  readonly createdAt: Scalars['DateTime']['output'];
  readonly email: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly role: UserRole;
};

/** Papel do usuário no CRM. */
export enum UserRole {
  Admin = 'ADMIN',
  Seller = 'SELLER'
}

/** Canais de conversa suportados. */
export enum WhatsAppChannel {
  Whatsapp = 'WHATSAPP'
}
