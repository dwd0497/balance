import { Command } from '@nestjs/cqrs';

export class ChangeUserPasswordCommand extends Command<void> {
  constructor(
    readonly userId: string,
    readonly passwordHash: string,
  ) {
    super();
  }
}
