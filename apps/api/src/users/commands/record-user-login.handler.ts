import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../users.repository';
import { RecordUserLoginCommand } from './record-user-login.command';

@CommandHandler(RecordUserLoginCommand)
export class RecordUserLoginHandler implements ICommandHandler<RecordUserLoginCommand> {
  constructor(private readonly users: UsersRepository) {}

  async execute({ userId }: RecordUserLoginCommand): Promise<void> {
    await this.users.touchLastLogin(userId);
  }
}
