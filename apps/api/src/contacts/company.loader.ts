import { UnauthorizedException } from '@nestjs/common';
import DataLoader from 'dataloader';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { Company } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export function createCompanyLoader(
  prisma: PrismaService,
  user: AuthenticatedUser | undefined,
): DataLoader<string, Company | null> {
  if (!user) {
    throw new UnauthorizedException('Sessão inválida');
  }

  return new DataLoader<string, Company | null>(async (ids) => {
    const companies = await prisma.company.findMany({
      where: {
        id: { in: [...ids] },
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
    });
    const byId = new Map(companies.map((company) => [company.id, company]));

    return ids.map((id) => byId.get(id) ?? null);
  });
}
