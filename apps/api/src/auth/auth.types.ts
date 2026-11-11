import type DataLoader from 'dataloader';
import type { Request } from 'express';
import type { Company, UserRole } from '../generated/prisma/client.js';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface GqlContext {
  req: Request;
  user?: AuthenticatedUser;
  companyLoader?: DataLoader<string, Company | null>;
}

export type PublicUser = AuthenticatedUser;
