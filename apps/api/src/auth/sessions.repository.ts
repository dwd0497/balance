import { Injectable } from '@nestjs/common';
import type { Session } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SessionMeta } from './auth.types';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: { userId: string; tokenHash: string; expiresAt: Date } & SessionMeta,
  ): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  findActive(id: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: { id, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async rotate(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.session.update({ where: { id }, data: { tokenHash, expiresAt } });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string, exceptId?: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, ...(exceptId && { id: { not: exceptId } }) },
      data: { revokedAt: new Date() },
    });
  }
}
