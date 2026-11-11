import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  decodeCursor,
  pageSize,
  toConnection,
  type Connection,
  type PaginationArgs,
} from '../common/pagination.js';
import { Prisma, type Contact } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateContactInput, UpdateContactInput } from './contact.input.js';

@Injectable()
export class ContactsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, args: PaginationArgs): Promise<Connection<Contact>> {
    const size = pageSize(args.first);
    const cursor = args.after ? decodeCursor(args.after) : null;
    const where: Prisma.ContactWhereInput = {
      ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
    };

    if (cursor) {
      const createdAt = new Date(cursor.createdAt);

      where.OR = [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: cursor.id } }];
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
          email: normalizeEmail(input.email),
          phone: normalizeOptional(input.phone),
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
      data.email = normalizeEmail(input.email);
    }

    if (input.phone !== undefined) {
      data.phone = normalizeOptional(input.phone);
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

  async delete(user: AuthenticatedUser, id: string): Promise<void> {
    await this.findById(user, id);
    await this.prisma.contact.delete({ where: { id } });
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

function mapUniqueConstraint(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return new BadRequestException('E-mail já cadastrado para este vendedor');
  }

  return error;
}
