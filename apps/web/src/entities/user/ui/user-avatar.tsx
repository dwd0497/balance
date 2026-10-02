import type { PublicUser } from '@balance/shared';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

export function getFullName(user: Pick<PublicUser, 'firstName' | 'lastName'>) {
  return `${user.firstName} ${user.lastName}`;
}

export function UserAvatar({ user }: { user: Pick<PublicUser, 'firstName' | 'lastName'> }) {
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  return (
    <Avatar className="size-8">
      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
    </Avatar>
  );
}
