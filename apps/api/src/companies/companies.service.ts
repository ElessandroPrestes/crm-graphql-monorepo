import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  decodeCursor,
  pageSize,
  toConnection,
  type Connection,
  type PaginationArgs,
} from '../common/pagination.js';
import { Prisma, type Company } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCompanyInput, UpdateCompanyInput } from './company.input.js';

@Injectable()
export class CompaniesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, args: PaginationArgs): Promise<Connection<Company>> {
    const size = pageSize(args.first);
    const cursor = args.after ? decodeCursor(args.after) : null;
    const where: Prisma.CompanyWhereInput = {
      ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
    };

    if (cursor) {
      const createdAt = new Date(cursor.createdAt);

      where.OR = [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: cursor.id } }];
    }

    const rows = await this.prisma.company.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: size + 1,
    });

    return toConnection(rows, size);
  }

  async findById(user: AuthenticatedUser, id: string): Promise<Company> {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  async create(user: AuthenticatedUser, input: CreateCompanyInput): Promise<Company> {
    try {
      return await this.prisma.company.create({
        data: {
          name: input.name,
          domain: normalizeOptional(input.domain),
          industry: normalizeOptional(input.industry),
          ownerId: user.id,
        },
      });
    } catch (error) {
      throw mapUniqueConstraint(error);
    }
  }

  async update(user: AuthenticatedUser, id: string, input: UpdateCompanyInput): Promise<Company> {
    const existing = await this.findById(user, id);
    const data: Prisma.CompanyUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.domain !== undefined) {
      data.domain = normalizeOptional(input.domain);
    }

    if (input.industry !== undefined) {
      data.industry = normalizeOptional(input.industry);
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    try {
      return await this.prisma.company.update({ where: { id }, data });
    } catch (error) {
      throw mapUniqueConstraint(error);
    }
  }

  async delete(user: AuthenticatedUser, id: string): Promise<void> {
    await this.findById(user, id);

    const contacts = await this.prisma.contact.count({ where: { companyId: id } });

    if (contacts > 0) {
      throw new BadRequestException('Empresa possui contatos vinculados');
    }

    try {
      await this.prisma.company.delete({ where: { id } });
    } catch (error) {
      throw mapDeleteConstraint(error);
    }
  }
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
    return new BadRequestException('Domínio já cadastrado');
  }

  return error;
}

function mapDeleteConstraint(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    return new BadRequestException('Empresa possui contatos vinculados');
  }

  return error;
}
