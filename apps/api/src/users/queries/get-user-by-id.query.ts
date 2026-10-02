import { Query } from '@nestjs/cqrs';
import type { PublicUser } from '@balance/shared';

export class GetUserByIdQuery extends Query<PublicUser | null> {
  constructor(readonly userId: string) {
    super();
  }
}
