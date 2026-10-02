import { Injectable } from '@nestjs/common';
import type { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  termsAcceptedAt: Date;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }
}
