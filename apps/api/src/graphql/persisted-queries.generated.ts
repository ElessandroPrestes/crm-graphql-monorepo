// Gerado por scripts/generate-persisted-queries.ts. Não edite manualmente.
export interface PersistedQueryEntry {
  name: string;
  query: string;
}

export const PERSISTED_QUERIES: Record<string, PersistedQueryEntry> = {
  "0cbbea7c0f2f80016eed8b34a24aaf72e1d040f2904dc109740976e15d3940a6": {
    "name": "CompaniesList",
    "query": "query CompaniesList($first: Int) {\n  companies(first: $first) {\n    edges {\n      node {\n        id\n        name\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"
  },
  "119e5e7d83ed394c08f688788c4034ddf1d90e58f47f21b7e21c6de3b45c7184": {
    "name": "ConversationDetail",
    "query": "query ConversationDetail($id: ID!) {\n  conversation(id: $id) {\n    id\n    contactId\n    lastMessageAt\n    createdAt\n    updatedAt\n    contact {\n      id\n      firstName\n      lastName\n      phone\n    }\n  }\n}"
  },
  "15e0c1724e0c44126a42ba0727430db2cc4a73a1101638fc60614335517f2f36": {
    "name": "CreateContact",
    "query": "mutation CreateContact($input: CreateContactInput!) {\n  createContact(input: $input) {\n    id\n    firstName\n    lastName\n    email\n    phone\n    jobTitle\n    companyId\n    createdAt\n    updatedAt\n    company {\n      id\n      name\n    }\n  }\n}"
  },
  "15fdf213e049040881ce6a9308d1f163dceeccb65ddf2a82eae3a7c4d2d3ad4b": {
    "name": "CreateDeal",
    "query": "mutation CreateDeal($input: CreateDealInput!) {\n  createDeal(input: $input) {\n    ...DealCard\n    __typename\n  }\n}\n\nfragment DealCard on Deal {\n  id\n  title\n  stage\n  valueCents\n  expectedCloseDate\n  closedAt\n  createdAt\n  updatedAt\n  version\n  companyId\n  contactId\n  contact {\n    id\n    firstName\n    lastName\n    __typename\n  }\n  company {\n    id\n    name\n    __typename\n  }\n  __typename\n}"
  },
  "1ca878bdf00c51258cce12986facb457662f267f6fd729db63c28084b9a9435e": {
    "name": "ActivitiesByContact",
    "query": "query ActivitiesByContact($contactId: ID!, $first: Int) {\n  activities(contactId: $contactId, first: $first) {\n    edges {\n      cursor\n      node {\n        id\n        type\n        subject\n        notes\n        occurredAt\n        contactId\n        dealId\n        ownerId\n        createdAt\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"
  },
  "1d15064d40f59a829901b75ae58363f42d20bd497d25ddc6cf8659996a8cb115": {
    "name": "ExportContactData",
    "query": "mutation ExportContactData($id: ID!) {\n  exportContactData(id: $id) {\n    exportedAt\n    contact {\n      id\n      firstName\n      lastName\n      email\n      phone\n      jobTitle\n      companyId\n      createdAt\n      updatedAt\n    }\n    company {\n      id\n      name\n      industry\n      domain\n    }\n    deals {\n      id\n      title\n      stage\n      valueCents\n      expectedCloseDate\n      closedAt\n      createdAt\n      updatedAt\n      version\n      companyId\n      contactId\n      ownerId\n    }\n    activities {\n      id\n      type\n      subject\n      notes\n      occurredAt\n      contactId\n      dealId\n      ownerId\n      createdAt\n    }\n    conversations {\n      conversation {\n        id\n        contactId\n        accountId\n        channel\n        lastMessageAt\n        createdAt\n        updatedAt\n        ownerId\n      }\n      messages {\n        id\n        conversationId\n        body\n        direction\n        status\n        clientMessageId\n        externalId\n        sentAt\n        createdAt\n        errorCode\n      }\n    }\n  }\n}"
  },
  "1d1c6c7f0140d571f9b52f44e30d5d8c9adc4b463bb2b3fcbab0739cd91c9364": {
    "name": "CreateContact",
    "query": "mutation CreateContact($input: CreateContactInput!) {\n  createContact(input: $input) {\n    id\n    firstName\n    lastName\n    email\n    phone\n    jobTitle\n    companyId\n    createdAt\n    updatedAt\n    company {\n      id\n      name\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "1d9b96d28cf7b7f236b772bd99688303dfef483db6f9068d743a3ecc07665655": {
    "name": "DashboardMetrics",
    "query": "query DashboardMetrics($periodStart: DateTime, $periodEnd: DateTime) {\n  dashboardMetrics(periodStart: $periodStart, periodEnd: $periodEnd) {\n    generatedAt\n    openDeals\n    openValueCents\n    wonDeals\n    wonValueCents\n    lostDeals\n    lostValueCents\n    stages {\n      stage\n      count\n      valueCents\n    }\n  }\n}"
  },
  "237819f6a0d34e03ea4c00548a037ec5905d046d35728371ffefd321e5628657": {
    "name": "ConversationsByContact",
    "query": "query ConversationsByContact($contactId: ID!, $first: Int) {\n  conversations(contactId: $contactId, first: $first) {\n    edges {\n      cursor\n      node {\n        id\n        contactId\n        lastMessageAt\n        createdAt\n        updatedAt\n        contact {\n          id\n          firstName\n          lastName\n          phone\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "25b8352ff990b5597684d1c26ce9c862d31ced8acd303c4613640399c7301c16": {
    "name": "DealsByContact",
    "query": "query DealsByContact($contactId: ID!, $first: Int) {\n  deals(contactId: $contactId, first: $first) {\n    edges {\n      cursor\n      node {\n        ...DealCard\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n\nfragment DealCard on Deal {\n  id\n  title\n  stage\n  valueCents\n  expectedCloseDate\n  closedAt\n  createdAt\n  updatedAt\n  version\n  companyId\n  contactId\n  contact {\n    id\n    firstName\n    lastName\n  }\n  company {\n    id\n    name\n  }\n}"
  },
  "35a6a82165498557715d285544ac4b4fbf918587a95abc2d94058062afa69250": {
    "name": "PipelineDeals",
    "query": "query PipelineDeals($first: Int, $stages: [DealStage!], $search: String, $contactId: ID, $companyId: ID) {\n  deals(\n    first: $first\n    stages: $stages\n    search: $search\n    contactId: $contactId\n    companyId: $companyId\n  ) {\n    edges {\n      cursor\n      node {\n        ...DealCard\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n\nfragment DealCard on Deal {\n  id\n  title\n  stage\n  valueCents\n  expectedCloseDate\n  closedAt\n  createdAt\n  updatedAt\n  version\n  companyId\n  contactId\n  contact {\n    id\n    firstName\n    lastName\n  }\n  company {\n    id\n    name\n  }\n}"
  },
  "38913d04563054b799eb4b74de1c8fd39a3ec9c18945fb7c738f5dcf8fa0c927": {
    "name": "Messages",
    "query": "query Messages($conversationId: ID!, $first: Int, $after: String) {\n  messages(conversationId: $conversationId, first: $first, after: $after) {\n    edges {\n      cursor\n      node {\n        id\n        conversationId\n        body\n        direction\n        status\n        clientMessageId\n        externalId\n        sentAt\n        createdAt\n        errorCode\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"
  },
  "39e8b6d12a61865b189599b85505ebe2247f6aab5192255f78fba4ec0018e1ae": {
    "name": "Messages",
    "query": "query Messages($conversationId: ID!, $first: Int, $after: String) {\n  messages(conversationId: $conversationId, first: $first, after: $after) {\n    edges {\n      cursor\n      node {\n        id\n        conversationId\n        body\n        direction\n        status\n        clientMessageId\n        externalId\n        sentAt\n        createdAt\n        errorCode\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "3c6da2be6d849d3f6b89425925b8576fbab4a77e758baea75150fbc4d5812365": {
    "name": "ConversationsList",
    "query": "query ConversationsList($first: Int, $after: String, $search: String) {\n  conversations(first: $first, after: $after, search: $search) {\n    edges {\n      cursor\n      node {\n        id\n        contactId\n        lastMessageAt\n        createdAt\n        updatedAt\n        contact {\n          id\n          firstName\n          lastName\n          phone\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "4ab595df74ab2b135cd27d8e6898f0c157524cd21355b3ca1ff4aefba420b6ea": {
    "name": "DeleteContact",
    "query": "mutation DeleteContact($id: ID!) {\n  deleteContact(id: $id)\n}"
  },
  "514ddd9a2bff61fb1fe45762dfd53b170529a9bf6b9441894cc086390591bf6a": {
    "name": "ConversationDetail",
    "query": "query ConversationDetail($id: ID!) {\n  conversation(id: $id) {\n    id\n    contactId\n    lastMessageAt\n    createdAt\n    updatedAt\n    contact {\n      id\n      firstName\n      lastName\n      phone\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "6372f6680adfbb654cf1a1854c8f5bd40a1b75a706da92f7fb9bb85333a2881f": {
    "name": "PipelineDeals",
    "query": "query PipelineDeals($first: Int, $stages: [DealStage!], $search: String, $contactId: ID, $companyId: ID) {\n  deals(\n    first: $first\n    stages: $stages\n    search: $search\n    contactId: $contactId\n    companyId: $companyId\n  ) {\n    edges {\n      cursor\n      node {\n        ...DealCard\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment DealCard on Deal {\n  id\n  title\n  stage\n  valueCents\n  expectedCloseDate\n  closedAt\n  createdAt\n  updatedAt\n  version\n  companyId\n  contactId\n  contact {\n    id\n    firstName\n    lastName\n    __typename\n  }\n  company {\n    id\n    name\n    __typename\n  }\n  __typename\n}"
  },
  "67c3c86948624e8b93135f78d2c8447d60539ea7d508f689997dcbc0bbb36a77": {
    "name": "ExportContactData",
    "query": "mutation ExportContactData($id: ID!) {\n  exportContactData(id: $id) {\n    exportedAt\n    contact {\n      id\n      firstName\n      lastName\n      email\n      phone\n      jobTitle\n      companyId\n      createdAt\n      updatedAt\n      __typename\n    }\n    company {\n      id\n      name\n      industry\n      domain\n      __typename\n    }\n    deals {\n      id\n      title\n      stage\n      valueCents\n      expectedCloseDate\n      closedAt\n      createdAt\n      updatedAt\n      version\n      companyId\n      contactId\n      ownerId\n      __typename\n    }\n    activities {\n      id\n      type\n      subject\n      notes\n      occurredAt\n      contactId\n      dealId\n      ownerId\n      createdAt\n      __typename\n    }\n    conversations {\n      conversation {\n        id\n        contactId\n        accountId\n        channel\n        lastMessageAt\n        createdAt\n        updatedAt\n        ownerId\n        __typename\n      }\n      messages {\n        id\n        conversationId\n        body\n        direction\n        status\n        clientMessageId\n        externalId\n        sentAt\n        createdAt\n        errorCode\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "79d95adf3d3ac009b014bf0318d4b3c1322e58bdbf51d5bd1214acbb7c038665": {
    "name": "DealsByContact",
    "query": "query DealsByContact($contactId: ID!, $first: Int) {\n  deals(contactId: $contactId, first: $first) {\n    edges {\n      cursor\n      node {\n        ...DealCard\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment DealCard on Deal {\n  id\n  title\n  stage\n  valueCents\n  expectedCloseDate\n  closedAt\n  createdAt\n  updatedAt\n  version\n  companyId\n  contactId\n  contact {\n    id\n    firstName\n    lastName\n    __typename\n  }\n  company {\n    id\n    name\n    __typename\n  }\n  __typename\n}"
  },
  "7c1f30a081cca94f281d4ec730adc6bc191b1f399bd4d56448feba86ff0a842d": {
    "name": "CreateActivity",
    "query": "mutation CreateActivity($input: CreateActivityInput!) {\n  createActivity(input: $input) {\n    id\n    type\n    subject\n    notes\n    occurredAt\n    contactId\n    dealId\n    ownerId\n    createdAt\n    __typename\n  }\n}"
  },
  "8e025cfc095d0149431f358221586adf0254ca84284be2af27cf159b6b245c35": {
    "name": "SendMessage",
    "query": "mutation SendMessage($input: SendMessageInput!) {\n  sendMessage(input: $input) {\n    id\n    conversationId\n    body\n    direction\n    status\n    clientMessageId\n    externalId\n    sentAt\n    createdAt\n    errorCode\n  }\n}"
  },
  "8fc6730f42f58c7d9e07b7510b7da90217e78e697fb899ec5cda761421af3a00": {
    "name": "Me",
    "query": "query Me {\n  me {\n    id\n    name\n    email\n    role\n    createdAt\n  }\n}"
  },
  "9c90345b5fb3d81e514d6d98584b8b1d3f7ef81871be805bd74cb9bd44e77580": {
    "name": "DashboardMetrics",
    "query": "query DashboardMetrics($periodStart: DateTime, $periodEnd: DateTime) {\n  dashboardMetrics(periodStart: $periodStart, periodEnd: $periodEnd) {\n    generatedAt\n    openDeals\n    openValueCents\n    wonDeals\n    wonValueCents\n    lostDeals\n    lostValueCents\n    stages {\n      stage\n      count\n      valueCents\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "a4552727a3b7fa0b611b0b75963a1625b6e143a00b127ae9ca2510d8550b4d5f": {
    "name": "CreateDeal",
    "query": "mutation CreateDeal($input: CreateDealInput!) {\n  createDeal(input: $input) {\n    ...DealCard\n  }\n}\n\nfragment DealCard on Deal {\n  id\n  title\n  stage\n  valueCents\n  expectedCloseDate\n  closedAt\n  createdAt\n  updatedAt\n  version\n  companyId\n  contactId\n  contact {\n    id\n    firstName\n    lastName\n  }\n  company {\n    id\n    name\n  }\n}"
  },
  "aaa0ab68dc4876de17ad98303f963f276a9aeea8164c663105d5231983891993": {
    "name": "UpdateDeal",
    "query": "mutation UpdateDeal($id: ID!, $input: UpdateDealInput!) {\n  updateDeal(id: $id, input: $input) {\n    ...DealCard\n    __typename\n  }\n}\n\nfragment DealCard on Deal {\n  id\n  title\n  stage\n  valueCents\n  expectedCloseDate\n  closedAt\n  createdAt\n  updatedAt\n  version\n  companyId\n  contactId\n  contact {\n    id\n    firstName\n    lastName\n    __typename\n  }\n  company {\n    id\n    name\n    __typename\n  }\n  __typename\n}"
  },
  "ae5d6f8b2056257bbc1f96918ab22ccfeb794594a7fa1dd63261777618d72d3b": {
    "name": "Me",
    "query": "query Me {\n  me {\n    id\n    name\n    email\n    role\n    createdAt\n    __typename\n  }\n}"
  },
  "ae7fdb2e418c29b97339cffcc7192c17cbf2c0990c7e22dfcdba572137d77908": {
    "name": "MessageReceived",
    "query": "subscription MessageReceived($conversationId: ID) {\n  messageReceived(conversationId: $conversationId) {\n    id\n    conversationId\n    body\n    direction\n    status\n    clientMessageId\n    externalId\n    sentAt\n    createdAt\n    errorCode\n    __typename\n  }\n}"
  },
  "af34468dbd8f5baf32550c0a1e8ac0f270e374524651b6df8250e204ed660163": {
    "name": "ContactDetail",
    "query": "query ContactDetail($id: ID!) {\n  contact(id: $id) {\n    id\n    firstName\n    lastName\n    email\n    phone\n    jobTitle\n    companyId\n    createdAt\n    updatedAt\n    company {\n      id\n      name\n      industry\n      domain\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "afcb277da0572e9b2c7de8a381400f0a606bdff1d04fceaa25c3abf4f672922a": {
    "name": "ContactsList",
    "query": "query ContactsList($first: Int, $after: String, $search: String, $companyId: ID) {\n  contacts(first: $first, after: $after, search: $search, companyId: $companyId) {\n    edges {\n      cursor\n      node {\n        id\n        firstName\n        lastName\n        email\n        phone\n        jobTitle\n        companyId\n        createdAt\n        updatedAt\n        company {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"
  },
  "b06a6240ad6f81edac8917007e6a7748132bc9dfd676d7533486cd9905a889fe": {
    "name": "UpdateDeal",
    "query": "mutation UpdateDeal($id: ID!, $input: UpdateDealInput!) {\n  updateDeal(id: $id, input: $input) {\n    ...DealCard\n  }\n}\n\nfragment DealCard on Deal {\n  id\n  title\n  stage\n  valueCents\n  expectedCloseDate\n  closedAt\n  createdAt\n  updatedAt\n  version\n  companyId\n  contactId\n  contact {\n    id\n    firstName\n    lastName\n  }\n  company {\n    id\n    name\n  }\n}"
  },
  "b6b14d107afc9d866e3ca66cbd8bbc646c1ef5241f526dfdecf4006b7f18aa1f": {
    "name": "SendMessage",
    "query": "mutation SendMessage($input: SendMessageInput!) {\n  sendMessage(input: $input) {\n    id\n    conversationId\n    body\n    direction\n    status\n    clientMessageId\n    externalId\n    sentAt\n    createdAt\n    errorCode\n    __typename\n  }\n}"
  },
  "c3300972a1ae34915d7d79638487b47db98808a237be4dd38c739d47e8d58007": {
    "name": "MessageReceived",
    "query": "subscription MessageReceived($conversationId: ID) {\n  messageReceived(conversationId: $conversationId) {\n    id\n    conversationId\n    body\n    direction\n    status\n    clientMessageId\n    externalId\n    sentAt\n    createdAt\n    errorCode\n  }\n}"
  },
  "c6efac8ad2b41d792f8d0b0b737ee9c46b0fe47d66161252df194a742ff26575": {
    "name": "ActivitiesByContact",
    "query": "query ActivitiesByContact($contactId: ID!, $first: Int) {\n  activities(contactId: $contactId, first: $first) {\n    edges {\n      cursor\n      node {\n        id\n        type\n        subject\n        notes\n        occurredAt\n        contactId\n        dealId\n        ownerId\n        createdAt\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "cc540fcc073ee29f99b5200630aae4f4667173bd49278c42ce8acc0f655bec0c": {
    "name": "CompaniesList",
    "query": "query CompaniesList($first: Int) {\n  companies(first: $first) {\n    edges {\n      node {\n        id\n        name\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "da09316f21407f7557a0778ee8b045d93f9b5fa2ac826613c57d50a534da22cd": {
    "name": "ContactsList",
    "query": "query ContactsList($first: Int, $after: String, $search: String, $companyId: ID) {\n  contacts(first: $first, after: $after, search: $search, companyId: $companyId) {\n    edges {\n      cursor\n      node {\n        id\n        firstName\n        lastName\n        email\n        phone\n        jobTitle\n        companyId\n        createdAt\n        updatedAt\n        company {\n          id\n          name\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}"
  },
  "e1f425f10faad3e68fa474164cf7eb677149480b921d696ddb6733ec1a47859e": {
    "name": "ContactDetail",
    "query": "query ContactDetail($id: ID!) {\n  contact(id: $id) {\n    id\n    firstName\n    lastName\n    email\n    phone\n    jobTitle\n    companyId\n    createdAt\n    updatedAt\n    company {\n      id\n      name\n      industry\n      domain\n    }\n  }\n}"
  },
  "e33a1b58d0a1d00975f36e4e46cad4ff291e3dc4a0aefd4581eeb142fcc54f5d": {
    "name": "CreateActivity",
    "query": "mutation CreateActivity($input: CreateActivityInput!) {\n  createActivity(input: $input) {\n    id\n    type\n    subject\n    notes\n    occurredAt\n    contactId\n    dealId\n    ownerId\n    createdAt\n  }\n}"
  },
  "e9ae17b953e47fd9787d25c16962b969c1d9423d6fda2d31eadf5234d72b1ddc": {
    "name": "ConversationsList",
    "query": "query ConversationsList($first: Int, $after: String, $search: String) {\n  conversations(first: $first, after: $after, search: $search) {\n    edges {\n      cursor\n      node {\n        id\n        contactId\n        lastMessageAt\n        createdAt\n        updatedAt\n        contact {\n          id\n          firstName\n          lastName\n          phone\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"
  },
  "f1f13b38f737483d1485dc2543f04c22e2ac92782f4fbc0bd41b2074f8651955": {
    "name": "ConversationsByContact",
    "query": "query ConversationsByContact($contactId: ID!, $first: Int) {\n  conversations(contactId: $contactId, first: $first) {\n    edges {\n      cursor\n      node {\n        id\n        contactId\n        lastMessageAt\n        createdAt\n        updatedAt\n        contact {\n          id\n          firstName\n          lastName\n          phone\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"
  }
};
