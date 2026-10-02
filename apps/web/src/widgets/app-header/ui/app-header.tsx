'use client';

import { LogOutIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { getFullName, useCurrentUser, UserAvatar } from '@/entities/user';
import { useLogout } from '@/features/auth/logout';
import { routes } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function AppHeader() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={routes.home} className="font-semibold tracking-tight">
          Balance
        </Link>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Меню профиля"
              >
                <UserAvatar user={user} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="grid">
                <span className="truncate">{getFullName(user)}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={routes.profile}>
                  <UserIcon />
                  Профиль
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
                <LogOutIcon />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
