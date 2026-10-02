import { Module } from '@nestjs/common';
import { ChangeUserPasswordHandler } from './commands/change-user-password.handler';
import { CreateUserHandler } from './commands/create-user.handler';
import { RecordUserLoginHandler } from './commands/record-user-login.handler';
import { GetUserByIdHandler } from './queries/get-user-by-id.handler';
import { GetUserCredentialsHandler } from './queries/get-user-credentials.handler';
import { UsersRepository } from './users.repository';

/** Ничего не экспортирует: доступ извне — только через шины CQRS и `./contracts`. */
@Module({
  providers: [
    UsersRepository,
    CreateUserHandler,
    ChangeUserPasswordHandler,
    RecordUserLoginHandler,
    GetUserByIdHandler,
    GetUserCredentialsHandler,
  ],
})
export class UsersModule {}
