import { ConflictException } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import type { PublicUser } from '@balance/shared';
import { Prisma } from '../../generated/prisma/client';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { toPublicUser } from '../users.mapper';
import { UsersRepository } from '../users.repository';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly users: UsersRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ data }: CreateUserCommand): Promise<PublicUser> {
    try {
      const user = await this.users.create(data);
      this.eventBus.publish(new UserRegisteredEvent(user.id));
      return toPublicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      throw error;
    }
  }
}
