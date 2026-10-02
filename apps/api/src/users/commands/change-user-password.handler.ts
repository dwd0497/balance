import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { UserPasswordChangedEvent } from '../events/user-password-changed.event';
import { UsersRepository } from '../users.repository';
import { ChangeUserPasswordCommand } from './change-user-password.command';

@CommandHandler(ChangeUserPasswordCommand)
export class ChangeUserPasswordHandler implements ICommandHandler<ChangeUserPasswordCommand> {
  constructor(
    private readonly users: UsersRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ userId, passwordHash }: ChangeUserPasswordCommand): Promise<void> {
    await this.users.updatePassword(userId, passwordHash);
    this.eventBus.publish(new UserPasswordChangedEvent(userId));
  }
}
