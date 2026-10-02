import { Command } from '@nestjs/cqrs';

export class RecordUserLoginCommand extends Command<void> {
  constructor(readonly userId: string) {
    super();
  }
}
