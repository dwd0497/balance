import { Command } from '@nestjs/cqrs';
import type { PublicUser } from '@balance/shared';

/** Создаёт пользователя. Пароль приходит уже захешированным. Email занят → ConflictException. */
export class CreateUserCommand extends Command<PublicUser> {
  constructor(
    readonly data: {
      firstName: string;
      lastName: string;
      email: string;
      passwordHash: string;
      termsAcceptedAt: Date;
    },
  ) {
    super();
  }
}
