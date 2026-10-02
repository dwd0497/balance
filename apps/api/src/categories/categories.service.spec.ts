import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, type Category as CategoryRow } from '../generated/prisma/client';
import type { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const userId = 'user-1';
  const now = new Date('2026-10-01T12:00:00.000Z');
  const row: CategoryRow = {
    id: 'cat-1',
    userId,
    name: 'Работы',
    color: '#ffb74d',
    createdAt: now,
    updatedAt: now,
  };
  const categories = {
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = new CategoriesService(categories as unknown as CategoriesRepository);

  const prismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('error', { code, clientVersion: 'test' });

  beforeEach(() => jest.resetAllMocks());

  it('возвращает категории пользователя без userId', async () => {
    categories.findAllByUser.mockResolvedValueOnce([row]);

    await expect(service.findAll(userId)).resolves.toEqual([
      {
        id: 'cat-1',
        name: 'Работы',
        color: '#ffb74d',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ]);
    expect(categories.findAllByUser).toHaveBeenCalledWith(userId);
  });

  it('бросает 404, если категории нет у пользователя', async () => {
    categories.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne(userId, 'cat-x')).rejects.toBeInstanceOf(NotFoundException);
    expect(categories.findOne).toHaveBeenCalledWith('cat-x', userId);
  });

  it('бросает 409 при создании категории с занятым именем', async () => {
    categories.create.mockRejectedValueOnce(prismaError('P2002'));

    await expect(
      service.create(userId, { name: 'Работы', color: '#000000' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('бросает 404 при обновлении чужой категории', async () => {
    categories.update.mockRejectedValueOnce(prismaError('P2025'));

    await expect(service.update(userId, 'cat-x', { name: 'Новое' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('бросает 409 при удалении категории, используемой в расходах', async () => {
    categories.delete.mockRejectedValueOnce(prismaError('P2003'));

    await expect(service.remove(userId, 'cat-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
