import { NotFoundException } from '@nestjs/common';
import { Prisma, type Transaction as TransactionRow } from '../generated/prisma/client';
import type { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  const userId = 'user-1';
  const now = new Date('2026-10-01T12:00:00.000Z');
  const row: TransactionRow = {
    id: 'tx-1',
    userId,
    categoryId: 'cat-1',
    amount: new Prisma.Decimal('1500.5'),
    type: 'EXPENSE',
    description: 'Плитка',
    date: new Date('2026-09-30T00:00:00.000Z'),
    createdAt: now,
  };
  const transactions = {
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    sumByType: jest.fn(),
  };
  const service = new TransactionsService(transactions as unknown as TransactionsRepository);

  const prismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('error', { code, clientVersion: 'test' });

  beforeEach(() => jest.resetAllMocks());

  it('возвращает транзакции пользователя: сумма строкой, дата без времени, без userId', async () => {
    transactions.findAllByUser.mockResolvedValueOnce([row]);
    const filter = { type: 'EXPENSE' as const, from: '2026-09-01' };

    await expect(service.findAll(userId, filter)).resolves.toEqual([
      {
        id: 'tx-1',
        amount: '1500.50',
        type: 'EXPENSE',
        description: 'Плитка',
        date: '2026-09-30',
        categoryId: 'cat-1',
        createdAt: now.toISOString(),
      },
    ]);
    expect(transactions.findAllByUser).toHaveBeenCalledWith(userId, filter);
  });

  it('бросает 404, если транзакции нет у пользователя', async () => {
    transactions.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne(userId, 'tx-x')).rejects.toBeInstanceOf(NotFoundException);
    expect(transactions.findOne).toHaveBeenCalledWith('tx-x', userId);
  });

  it('бросает 404 при создании с чужой или несуществующей категорией', async () => {
    transactions.create.mockRejectedValueOnce(prismaError('P2025'));

    await expect(
      service.create(userId, {
        amount: '100',
        type: 'INCOME',
        date: '2026-10-01',
        categoryId: 'cat-x',
      }),
    ).rejects.toThrow('Категория не найдена');
  });

  it('не обновляет чужую транзакцию', async () => {
    transactions.findOne.mockResolvedValueOnce(null);

    await expect(service.update(userId, 'tx-x', { amount: '10' })).rejects.toThrow(
      'Транзакция не найдена',
    );
    expect(transactions.update).not.toHaveBeenCalled();
  });

  it('бросает 404 при обновлении с чужой категорией', async () => {
    transactions.findOne.mockResolvedValueOnce(row);
    transactions.update.mockRejectedValueOnce(prismaError('P2025'));

    await expect(service.update(userId, 'tx-1', { categoryId: 'cat-x' })).rejects.toThrow(
      'Категория не найдена',
    );
  });

  it('бросает 404 при удалении чужой транзакции', async () => {
    transactions.delete.mockRejectedValueOnce(prismaError('P2025'));

    await expect(service.remove(userId, 'tx-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('считает сводку: доходы, расходы и баланс, который может быть отрицательным', async () => {
    transactions.sumByType.mockResolvedValueOnce({
      INCOME: new Prisma.Decimal('1000'),
      EXPENSE: new Prisma.Decimal('1500.5'),
    });

    await expect(service.summary(userId, {})).resolves.toEqual({
      income: '1000.00',
      expense: '1500.50',
      balance: '-500.50',
    });
  });
});
