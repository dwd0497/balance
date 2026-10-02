import { ConflictException } from '@nestjs/common';
import type { EventBus } from '@nestjs/cqrs';
import { Prisma, type User } from '../../generated/prisma/client';
import { UserRegisteredEvent } from '../events/user-registered.event';
import type { UsersRepository } from '../users.repository';
import { CreateUserCommand } from './create-user.command';
import { CreateUserHandler } from './create-user.handler';

describe('CreateUserHandler', () => {
  const data = {
    firstName: 'Иван',
    lastName: 'Петров',
    email: 'ivan@example.com',
    passwordHash: 'hash',
    termsAcceptedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const users = { create: jest.fn() };
  const eventBus = { publish: jest.fn() };
  const handler = new CreateUserHandler(
    users as unknown as UsersRepository,
    eventBus as unknown as EventBus,
  );

  beforeEach(() => jest.resetAllMocks());

  it('создаёт пользователя, публикует событие и не отдаёт хеш пароля', async () => {
    const now = new Date();
    users.create.mockResolvedValueOnce({
      ...data,
      id: 'user-1',
      isActive: true,
      lastLoginAt: null,
      passwordChangedAt: null,
      createdAt: now,
      updatedAt: now,
    } satisfies User);

    const result = await handler.execute(new CreateUserCommand(data));

    expect(result).toEqual({
      id: 'user-1',
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      createdAt: now.toISOString(),
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(eventBus.publish).toHaveBeenCalledWith(new UserRegisteredEvent('user-1'));
  });

  it('бросает 409, если email занят', async () => {
    users.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(handler.execute(new CreateUserCommand(data))).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
