import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { PublicUser } from '@balance/shared';
import { toPublicUser } from '../users.mapper';
import { UsersRepository } from '../users.repository';
import { GetUserByIdQuery } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly users: UsersRepository) {}

  async execute({ userId }: GetUserByIdQuery): Promise<PublicUser | null> {
    const user = await this.users.findById(userId);
    return user ? toPublicUser(user) : null;
  }
}
