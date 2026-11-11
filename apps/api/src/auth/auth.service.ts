import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import type { ApiEnv } from '../config/env.js';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AccessTokenPayload, AuthenticatedUser, PublicUser } from './auth.types.js';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

let dummyHashPromise: Promise<string> | undefined;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= argon2.hash('invalid-password', ARGON2_OPTIONS);

  return dummyHashPromise;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export interface SessionResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: PublicUser;
}

export interface AccessTokenResult {
  accessToken: string;
  expiresIn: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class AuthService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) config: ConfigService<ApiEnv, true>,
  ) {
    this.accessTtl = config.get('ACCESS_TOKEN_TTL_SECONDS', { infer: true });
    this.refreshTtl = config.get('REFRESH_TOKEN_TTL_SECONDS', { infer: true });
  }

  async login(input: LoginInput): Promise<SessionResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordHash = user?.passwordHash ?? (await getDummyHash());
    const validPassword = await argon2.verify(passwordHash, input.password).catch(() => false);

    if (!user || !validPassword) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.createSession(user);
  }

  async refresh(rawToken: string): Promise<SessionResult> {
    if (rawToken.length === 0) {
      throw new UnauthorizedException('Sessão inválida');
    }

    const tokenHash = hashToken(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Sessão inválida');
    }

    if (existing.revokedAt) {
      await this.revokeFamily(existing.familyId);
      throw new UnauthorizedException('Sessão inválida');
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      await this.prisma.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Sessão inválida');
    }

    const nextRawToken = generateRefreshToken();
    const nextTokenHash = hashToken(nextRawToken);
    const rotated = await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (claimed.count !== 1) {
        return null;
      }

      const created = await transaction.refreshToken.create({
        data: {
          userId: existing.userId,
          tokenHash: nextTokenHash,
          familyId: existing.familyId,
          expiresAt: this.refreshExpiry(),
        },
      });

      await transaction.refreshToken.update({
        where: { id: existing.id },
        data: { replacedByTokenId: created.id },
      });

      return created;
    });

    if (!rotated) {
      await this.revokeFamily(existing.familyId);
      throw new UnauthorizedException('Sessão inválida');
    }

    const accessToken = await this.signAccessToken(existing.user);

    return {
      ...accessToken,
      refreshToken: nextRawToken,
      user: toPublicUser(existing.user),
    };
  }

  async logout(rawToken: string): Promise<void> {
    if (rawToken.length === 0) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        algorithms: ['HS256'],
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

      if (!user) {
        throw new UnauthorizedException('Sessão inválida');
      }

      return toPublicUser(user);
    } catch {
      throw new UnauthorizedException('Sessão inválida');
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Sessão inválida');
    }

    return toPublicUser(user);
  }

  private async createSession(user: User): Promise<SessionResult> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, randomUUID());

    return {
      ...accessToken,
      refreshToken,
      user: toPublicUser(user),
    };
  }

  private async signAccessToken(user: User): Promise<AccessTokenResult> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      algorithm: 'HS256',
      expiresIn: this.accessTtl,
    });

    return { accessToken, expiresIn: this.accessTtl };
  }

  private async issueRefreshToken(userId: string, familyId: string): Promise<string> {
    const rawToken = generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawToken),
        familyId,
        expiresAt: this.refreshExpiry(),
      },
    });

    return rawToken;
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.refreshTtl * 1000);
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
