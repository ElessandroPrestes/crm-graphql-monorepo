import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { normalizePhone } from '@nexo/shared';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { normalizeSearch, optionalUuid } from '../common/filters.js';
import {
  decodeCursor,
  pageSize,
  toConnection,
  type Connection,
  type PaginationArgs,
} from '../common/pagination.js';
import {
  Prisma,
  type Activity,
  type Company,
  type Contact,
  type Conversation,
  type Deal,
  type Message,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateContactInput, UpdateContactInput } from './contact.input.js';

export interface ContactExportData {
  exportedAt: Date;
  contact: Contact;
  company: Company | null;
  deals: Deal[];
  activities: Activity[];
  conversations: Array<{ conversation: Conversation; messages: Message[] }>;
}

export interface ContactListArgs extends PaginationArgs {
  search?: string;
  companyId?: string;
}

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, args: ContactListArgs): Promise<Connection<Contact>> {
    const size = pageSize(args.first);
    const cursor = args.after ? decodeCursor(args.after) : null;
    const search = normalizeSearch(args.search);
    const companyId = optionalUuid(args.companyId, 'companyId');
    const where: Prisma.ContactWhereInput = {
      ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
    };
    const filters: Prisma.ContactWhereInput[] = [];

    if (search) {
      filters.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (companyId) {
      filters.push({ companyId });
    }

    if (cursor) {
      const createdAt = new Date(cursor.createdAt);

      filters.push({
        OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: cursor.id } }],
      });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    const rows = await this.prisma.contact.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: size + 1,
    });

    return toConnection(rows, size);
  }

  async findById(user: AuthenticatedUser, id: string): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    return contact;
  }

  async create(user: AuthenticatedUser, input: CreateContactInput): Promise<Contact> {
    const companyId = await this.resolveCompanyId(user, input.companyId);

    try {
      return await this.prisma.contact.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email ? normalizeEmail(input.email) : null,
          phone: normalizeOptional(input.phone),
          phoneNormalized: normalizePhoneOrNull(input.phone),
          jobTitle: normalizeOptional(input.jobTitle),
          companyId,
          ownerId: user.id,
        },
      });
    } catch (error) {
      throw mapUniqueConstraint(error);
    }
  }

  async update(user: AuthenticatedUser, id: string, input: UpdateContactInput): Promise<Contact> {
    const existing = await this.findById(user, id);
    const data: Prisma.ContactUpdateInput = {};

    if (input.firstName !== undefined) {
      data.firstName = input.firstName;
    }

    if (input.lastName !== undefined) {
      data.lastName = input.lastName;
    }

    if (input.email !== undefined) {
      data.email = input.email ? normalizeEmail(input.email) : null;
    }

    if (input.phone !== undefined) {
      const phone = normalizeOptional(input.phone);

      data.phone = phone;
      data.phoneNormalized = phone ? normalizePhone(phone) : null;
    }

    if (input.jobTitle !== undefined) {
      data.jobTitle = normalizeOptional(input.jobTitle);
    }

    if (input.companyId !== undefined) {
      const companyId = await this.resolveCompanyId(user, input.companyId);

      data.company = companyId === null ? { disconnect: true } : { connect: { id: companyId } };
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    try {
      return await this.prisma.contact.update({ where: { id }, data });
    } catch (error) {
      throw mapUniqueConstraint(error);
    }
  }

  async delete(user: AuthenticatedUser, id: string, requestId?: string): Promise<void> {
    await this.findById(user, id);
    this.audit('contact.delete', user.id, id, requestId);
    await this.prisma.contact.delete({ where: { id } });
  }

  async exportData(
    user: AuthenticatedUser,
    id: string,
    requestId?: string,
  ): Promise<ContactExportData> {
    const contact = await this.findById(user, id);
    const ownerScope = user.role === 'ADMIN' ? {} : { ownerId: user.id };

    const [company, deals, activities, conversations] = await Promise.all([
      contact.companyId
        ? this.prisma.company.findFirst({
            where: { id: contact.companyId, ...ownerScope },
          })
        : Promise.resolve(null),
      this.prisma.deal.findMany({
        where: { contactId: contact.id, ...ownerScope },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.activity.findMany({
        where: { contactId: contact.id, ...ownerScope },
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.conversation.findMany({
        where: { contactId: contact.id, ...ownerScope },
        orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
        include: {
          messages: { orderBy: [{ sentAt: 'desc' }, { id: 'desc' }] },
        },
      }),
    ]);

    this.audit('contact.export', user.id, contact.id, requestId);

    return {
      exportedAt: new Date(),
      contact,
      company,
      deals,
      activities,
      conversations: conversations.map((conversation) => ({
        conversation,
        messages: conversation.messages,
      })),
    };
  }

  private audit(
    event: 'contact.export' | 'contact.delete',
    actorId: string,
    contactId: string,
    requestId?: string,
  ): void {
    this.logger.log(
      JSON.stringify({
        event,
        actorId,
        contactId,
        ...(requestId ? { requestId } : {}),
      }),
    );
  }

  private async resolveCompanyId(
    user: AuthenticatedUser,
    companyId: string | null | undefined,
  ): Promise<string | null> {
    if (companyId === undefined || companyId === null || companyId.length === 0) {
      return null;
    }

    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
    });

    if (!company) {
      throw new BadRequestException('Empresa inválida');
    }

    return company.id;
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeOptional(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}

function normalizePhoneOrNull(value: string | null | undefined): string | null {
  const phone = normalizeOptional(value);

  return phone ? normalizePhone(phone) : null;
}

function mapUniqueConstraint(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return new BadRequestException('E-mail ou telefone já cadastrado para este vendedor');
  }

  return error;
}
