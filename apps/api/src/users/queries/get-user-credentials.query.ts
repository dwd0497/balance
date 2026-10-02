import { Query } from '@nestjs/cqrs';
import type { UserCredentials } from '../contracts/user-credentials';

export type UserLookup = { email: string } | { userId: string };

export class GetUserCredentialsQuery extends Query<UserCredentials | null> {
  constructor(readonly lookup: UserLookup) {
    super();
  }
}
