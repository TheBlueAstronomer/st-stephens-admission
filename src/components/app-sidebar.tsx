'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  HouseIcon,
  UsersIcon,
  CalendarBlankIcon,
  ChartBarIcon,
  GearIcon,
  SignOutIcon,
} from '@phosphor-icons/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getNavItemsForRole } from '@/lib/rbac';
import type { UserRole } from '@/generated/prisma/client';

const ICON_MAP: Record<string, React.ComponentType<React.ComponentProps<typeof HouseIcon>>> = {
  House: HouseIcon,
  Users: UsersIcon,
  CalendarBlank: CalendarBlankIcon,
  ChartBar: ChartBarIcon,
  Gear: GearIcon,
};

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  ADMISSIONS_STAFF: 'bg-white/20 text-white',
  ACADEMIC_STAFF: 'bg-[#C4A882]/30 text-[#C4A882]',
  SENIOR_LEADERSHIP: 'bg-white/10 text-white/60',
  SYSTEM_ADMINISTRATOR: 'bg-white/25 text-white',
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMISSIONS_STAFF: 'Admissions',
  ACADEMIC_STAFF: 'Academic',
  SENIOR_LEADERSHIP: 'Leadership',
  SYSTEM_ADMINISTRATOR: 'Admin',
};

interface AppSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItemsForRole(user.role);
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs font-bold text-white">
            SSH
          </div>
          <span className="text-sm font-semibold text-white truncate group-data-[collapsible=icon]:hidden">
            St Stephen&apos;s House
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = ICON_MAP[item.icon];
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      className={
                        isActive
                          ? 'bg-white/15 text-white rounded-xl hover:bg-white/20 hover:text-white'
                          : 'text-white/70 hover:bg-white/8 hover:text-white rounded-xl'
                      }
                    >
                      {Icon && <Icon size={20} weight="light" />}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/8" />}
          >
              <Avatar className="h-8 w-8 shrink-0">
                {user.image && <AvatarImage src={user.image} alt={user.name} />}
                <AvatarFallback className="text-xs bg-white/15 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-white">{user.name}</span>
                <Badge
                  className={`mt-0.5 w-fit text-[10px] border-0 ${ROLE_BADGE_COLORS[user.role]}`}
                >
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive"
            >
              <SignOutIcon size={16} weight="light" className="mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
