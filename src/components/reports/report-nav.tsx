'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const REPORT_LINKS = [
  { href: '/reports/pipeline', label: 'Pipeline' },
  { href: '/reports/diocese', label: 'Diocese Distribution' },
  { href: '/reports/bap-status', label: 'BAP Status' },
  { href: '/reports/offers-registrations', label: 'Offers vs Registrations' },
  { href: '/reports/accommodation', label: 'Accommodation Demand' },
  { href: '/reports/missing-documents', label: 'Missing Documents' },
];

export function ReportNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 space-y-1" aria-label="Report navigation">
      {REPORT_LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'block rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#1A2744]/8 text-[#1A2744]'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
