'use client';

import { signOut } from 'next-auth/react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/generated/prisma/client';

interface AppTopbarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role: UserRole;
  };
}

export function AppTopbar({ user }: AppTopbarProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-black/6 bg-white/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="text-sm text-muted-foreground">
            Admissions
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Search applicants">
          <MagnifyingGlassIcon size={18} weight="light" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />}
          >
              <Avatar className="h-8 w-8">
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name} />
                )}
                <AvatarFallback className="text-xs bg-[#1A2744]/10 text-[#1A2744]">
                  {initials}
                </AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
