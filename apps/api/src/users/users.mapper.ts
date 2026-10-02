import type { PublicUser } from '@balance/shared';
import type { User } from '../generated/prisma/client';
import type { UserCredentials } from './contracts/user-credentials';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toUserCredentials(user: User): UserCredentials {
  return { id: user.id, passwordHash: user.passwordHash, isActive: user.isActive };
}
