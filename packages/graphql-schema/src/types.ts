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
  readonly email: Scalars['String']['output'];
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

export type ContactEdge = {
  readonly __typename?: 'ContactEdge';
  readonly cursor: Scalars['String']['output'];
  readonly node: Contact;
};

export type CreateCompanyInput = {
  readonly domain?: InputMaybe<Scalars['String']['input']>;
  readonly industry?: InputMaybe<Scalars['String']['input']>;
  readonly name: Scalars['String']['input'];
};

export type CreateContactInput = {
  readonly companyId?: InputMaybe<Scalars['ID']['input']>;
  readonly email: Scalars['String']['input'];
  readonly firstName: Scalars['String']['input'];
  readonly jobTitle?: InputMaybe<Scalars['String']['input']>;
  readonly lastName: Scalars['String']['input'];
  readonly phone?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  readonly __typename?: 'Mutation';
  readonly createCompany: Company;
  readonly createContact: Contact;
  readonly deleteCompany: Scalars['Boolean']['output'];
  readonly deleteContact: Scalars['Boolean']['output'];
  readonly updateCompany: Company;
  readonly updateContact: Contact;
};


export type MutationCreateCompanyArgs = {
  input: CreateCompanyInput;
};


export type MutationCreateContactArgs = {
  input: CreateContactInput;
};


export type MutationDeleteCompanyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContactArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateCompanyArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCompanyInput;
};


export type MutationUpdateContactArgs = {
  id: Scalars['ID']['input'];
  input: UpdateContactInput;
};

export type PageInfoType = {
  readonly __typename?: 'PageInfoType';
  readonly endCursor?: Maybe<Scalars['String']['output']>;
  readonly hasNextPage: Scalars['Boolean']['output'];
};

export type Query = {
  readonly __typename?: 'Query';
  readonly companies: CompanyConnection;
  readonly company: Company;
  readonly contact: Contact;
  readonly contacts: ContactConnection;
  readonly me: User;
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
