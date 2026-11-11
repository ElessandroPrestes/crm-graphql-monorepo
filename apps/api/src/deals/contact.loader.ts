import { UnauthorizedException } from '@nestjs/common';
import DataLoader from 'dataloader';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { Contact } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export function createContactLoader(
  prisma: PrismaService,
  user: AuthenticatedUser | undefined,
): DataLoader<string, Contact | null> {
  if (!user) {
    throw new UnauthorizedException('Sessão inválida');
  }

  return new DataLoader<string, Contact | null>(async (ids) => {
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: [...ids] },
        ...(user.role === 'ADMIN' ? {} : { ownerId: user.id }),
      },
    });
    const byId = new Map(contacts.map((contact) => [contact.id, contact]));

    return ids.map((id) => byId.get(id) ?? null);
  });
}
