'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  UsersIcon,
  GraduationCapIcon,
  ChurchIcon,
  FileTextIcon,
  CalendarIcon,
  ClipboardTextIcon,
} from '@phosphor-icons/react';

const ADMIN_LINKS = [
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/programmes', label: 'Programmes', icon: GraduationCapIcon },
  { href: '/admin/dioceses', label: 'Dioceses', icon: ChurchIcon },
  { href: '/admin/document-types', label: 'Document Types', icon: FileTextIcon },
  { href: '/admin/admissions-years', label: 'Admissions Years', icon: CalendarIcon },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ClipboardTextIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 space-y-1" aria-label="Admin navigation">
      {ADMIN_LINKS.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#1A2744]/8 text-[#1A2744]'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon size={16} weight={isActive ? 'fill' : 'light'} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
