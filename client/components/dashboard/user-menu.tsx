'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import {
  CreditCardIcon,
  KeyIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  FileTextIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

type UserMenuProps = {
  align?: 'start' | 'end' | 'center';
  showLabel?: boolean;
};

export function UserMenu({ align = 'end', showLabel = true }: UserMenuProps) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  const initials = user?.firstName?.[0]?.toUpperCase() ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1.5 text-sm text-gray-700 transition-all hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-xs font-bold text-white">
            {initials}
          </div>
          {showLabel && (
            <div className="hidden flex-col items-start text-left sm:flex">
              <span className="text-sm font-medium leading-tight">{user?.fullName ?? 'User'}</span>
              <span className="text-xs text-gray-500 dark:text-zinc-500">
                {user?.emailAddresses?.[0]?.emailAddress ?? ''}
              </span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{user?.fullName ?? 'User'}</span>
            <span className="text-xs font-normal text-gray-500 dark:text-zinc-500">
              {user?.emailAddresses?.[0]?.emailAddress ?? ''}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex cursor-pointer items-center gap-2">
              <LayoutDashboardIcon className="h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/templates" className="flex cursor-pointer items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Templates
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/api-keys" className="flex cursor-pointer items-center gap-2">
              <KeyIcon className="h-4 w-4" />
              API Keys
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/billing" className="flex cursor-pointer items-center gap-2">
              <CreditCardIcon className="h-4 w-4" />
              Billing
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex cursor-pointer items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <UserIcon className="h-4 w-4" />
          Manage Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ redirectUrl: '/' })}>
          <LogOutIcon className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
