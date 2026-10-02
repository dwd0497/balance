import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { UserCredentials } from '../contracts/user-credentials';
import { toUserCredentials } from '../users.mapper';
import { UsersRepository } from '../users.repository';
import { GetUserCredentialsQuery } from './get-user-credentials.query';

@QueryHandler(GetUserCredentialsQuery)
export class GetUserCredentialsHandler implements IQueryHandler<GetUserCredentialsQuery> {
  constructor(private readonly users: UsersRepository) {}

  async execute({ lookup }: GetUserCredentialsQuery): Promise<UserCredentials | null> {
    const user =
      'email' in lookup
        ? await this.users.findByEmail(lookup.email)
        : await this.users.findById(lookup.userId);
    return user ? toUserCredentials(user) : null;
  }
}
