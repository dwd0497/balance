import { Injectable } from '@nestjs/common';
import type { TransactionsFilter, TransactionType } from '@balance/shared';
import { Prisma, type Transaction } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface TransactionData {
  amount: string;
  type: TransactionType;
  description?: string | null;
  date: string;
  categoryId: string;
}

/**
 * Все операции ограничены владельцем: чужая транзакция неотличима от несуществующей.
 * Категория подключается через `connect { id, userId }` — чужая или несуществующая → P2025.
 */
@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string, filter: TransactionsFilter): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: toWhere(userId, filter),
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findOne(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, userId } });
  }

  create(userId: string, { categoryId, date, ...data }: TransactionData): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        ...data,
        date: new Date(date),
        user: { connect: { id: userId } },
        category: { connect: { id: categoryId, userId } },
      },
    });
  }

  /** Нет транзакции или категории у пользователя → Prisma P2025. */
  update(id: string, userId: string, data: Partial<TransactionData>): Promise<Transaction> {
    const { categoryId, date, ...rest } = data;
    return this.prisma.transaction.update({
      where: { id, userId },
      data: {
        ...rest,
        ...(date && { date: new Date(date) }),
        ...(categoryId && { category: { connect: { id: categoryId, userId } } }),
      },
    });
  }

  /** Нет транзакции у пользователя → P2025. */
  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id, userId } });
  }

  /** Суммы по типам операций с теми же фильтрами, что у списка. */
  async sumByType(
    userId: string,
    filter: TransactionsFilter,
  ): Promise<Record<TransactionType, Prisma.Decimal>> {
    const groups = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: toWhere(userId, filter),
      _sum: { amount: true },
    });
    const sums = { INCOME: new Prisma.Decimal(0), EXPENSE: new Prisma.Decimal(0) };
    for (const group of groups) sums[group.type] = group._sum.amount ?? sums[group.type];
    return sums;
  }
}

function toWhere(userId: string, filter: TransactionsFilter): Prisma.TransactionWhereInput {
  return {
    userId,
    type: filter.type,
    categoryId: filter.categoryId,
    date: {
      ...(filter.from && { gte: new Date(filter.from) }),
      ...(filter.to && { lte: new Date(filter.to) }),
    },
  };
}
