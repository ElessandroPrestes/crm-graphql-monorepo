import { UnauthorizedException } from '@nestjs/common';
import DataLoader from 'dataloader';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { Deal } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export function createDealLoader(
  prisma: PrismaService,
  user: AuthenticatedUser | undefined,
): DataLoader<string, Deal | null> {
  if (!user) {
    throw new UnauthorizedException('Sessão inválida');
  }

  return new DataLoader<string, Deal | null>(async (ids) => {
    const deals = await prisma.deal.findMany({
      where: {
        id: { in: [...ids] },
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
    });
    const byId = new Map(deals.map((deal) => [deal.id, deal]));

    return ids.map((id) => byId.get(id) ?? null);
  });
}
