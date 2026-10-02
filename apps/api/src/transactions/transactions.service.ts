import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateTransactionInput,
  Transaction,
  TransactionsFilter,
  TransactionsSummary,
  UpdateTransactionInput,
} from '@balance/shared';
import { Prisma } from '../generated/prisma/client';
import { toTransaction } from './transactions.mapper';
import { TransactionsRepository } from './transactions.repository';

const NOT_FOUND = 'Транзакция не найдена';
const CATEGORY_NOT_FOUND = 'Категория не найдена';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactions: TransactionsRepository) {}

  async findAll(userId: string, filter: TransactionsFilter): Promise<Transaction[]> {
    const rows = await this.transactions.findAllByUser(userId, filter);
    return rows.map(toTransaction);
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const row = await this.transactions.findOne(id, userId);
    if (!row) throw new NotFoundException(NOT_FOUND);
    return toTransaction(row);
  }

  async create(userId: string, input: CreateTransactionInput): Promise<Transaction> {
    try {
      return toTransaction(await this.transactions.create(userId, input));
    } catch (error) {
      // Единственный connect, который может не найтись, — категория
      if (isPrismaError(error, 'P2025')) throw new NotFoundException(CATEGORY_NOT_FOUND);
      throw error;
    }
  }

  async update(userId: string, id: string, input: UpdateTransactionInput): Promise<Transaction> {
    // Сначала проверяем саму транзакцию, чтобы P2025 при обновлении однозначно означал категорию
    await this.findOne(userId, id);
    try {
      return toTransaction(await this.transactions.update(id, userId, input));
    } catch (error) {
      if (isPrismaError(error, 'P2025')) throw new NotFoundException(CATEGORY_NOT_FOUND);
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      await this.transactions.delete(id, userId);
    } catch (error) {
      if (isPrismaError(error, 'P2025')) throw new NotFoundException(NOT_FOUND);
      throw error;
    }
  }

  async summary(userId: string, filter: TransactionsFilter): Promise<TransactionsSummary> {
    const { INCOME, EXPENSE } = await this.transactions.sumByType(userId, filter);
    return {
      income: INCOME.toFixed(2),
      expense: EXPENSE.toFixed(2),
      balance: INCOME.minus(EXPENSE).toFixed(2),
    };
  }
}

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
