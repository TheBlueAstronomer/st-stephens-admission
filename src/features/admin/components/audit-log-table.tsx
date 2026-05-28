'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { AuditAction } from '@/generated/prisma/client';

interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  previousValue: string | null;
  newValue: string | null;
  performedAt: Date;
  user: { id: string; name: string; email: string } | null;
  applicant: { id: string; legalName: string } | null;
}

interface FilterOptions {
  users: { id: string; name: string }[];
  entityTypes: string[];
  actions: AuditAction[];
}

const ACTION_LABELS: Partial<Record<AuditAction, string>> = {
  USER_CREATED: 'User Created',
  USER_DEACTIVATED: 'User Deactivated',
  USER_REACTIVATED: 'User Reactivated',
  ROLE_CHANGED: 'Role Changed',
  PROGRAMME_CREATED: 'Programme Created',
  PROGRAMME_DEACTIVATED: 'Programme Deactivated',
  PROGRAMME_REACTIVATED: 'Programme Reactivated',
  PROGRAMME_UPDATED: 'Programme Updated',
  DIOCESE_CREATED: 'Diocese Created',
  DIOCESE_UPDATED: 'Diocese Updated',
  DOCUMENT_TYPE_CREATED: 'Doc Type Created',
  DOCUMENT_TYPE_UPDATED: 'Doc Type Updated',
  ADMISSIONS_YEAR_CREATED: 'Year Created',
  STATUS_CHANGE: 'Status Changed',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INVITATION_SENT: 'Invitation Sent',
  APPLICATION_RECEIVED: 'Application Received',
  OFFER_CREATED: 'Offer Created',
  OFFER_ACCEPTED: 'Offer Accepted',
  REGISTRATION_RECEIVED: 'Registration Received',
  CONFIRMED_ORDINAND: 'Confirmed Ordinand',
};

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditLogTable({
  entries,
  page,
  totalPages,
  total,
  filterOptions,
}: {
  entries: AuditEntry[];
  page: number;
  totalPages: number;
  total: number;
  filterOptions: FilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', p.toString());
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          value={searchParams.get('action') ?? ''}
          onChange={(e) => updateFilter('action', e.target.value || undefined)}
          aria-label="Filter by action"
        >
          <NativeSelectOption value="">All Actions</NativeSelectOption>
          {filterOptions.actions.map((a) => (
            <NativeSelectOption key={a} value={a}>
              {ACTION_LABELS[a] ?? a}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <NativeSelect
          value={searchParams.get('entityType') ?? ''}
          onChange={(e) => updateFilter('entityType', e.target.value || undefined)}
          aria-label="Filter by entity type"
        >
          <NativeSelectOption value="">All Entities</NativeSelectOption>
          {filterOptions.entityTypes.map((et) => (
            <NativeSelectOption key={et} value={et}>{et}</NativeSelectOption>
          ))}
        </NativeSelect>

        <NativeSelect
          value={searchParams.get('userId') ?? ''}
          onChange={(e) => updateFilter('userId', e.target.value || undefined)}
          aria-label="Filter by user"
        >
          <NativeSelectOption value="">All Users</NativeSelectOption>
          {filterOptions.users.map((u) => (
            <NativeSelectOption key={u.id} value={u.id}>{u.name}</NativeSelectOption>
          ))}
        </NativeSelect>

        {isPending && <span className="text-xs text-muted-foreground">Loading...</span>}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No audit log entries found.
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(entry.performedAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[11px]">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{entry.entityType}</span>
                  {entry.applicant && (
                    <span className="ml-1 text-xs">
                      ({entry.applicant.legalName})
                    </span>
                  )}
                </TableCell>
                <TableCell>{entry.user?.name ?? '—'}</TableCell>
                <TableCell className="max-w-50 truncate text-xs text-muted-foreground">
                  {entry.newValue && (
                    <span title={entry.newValue}>{entry.newValue}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {total} entries · Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isPending}
            >
              <CaretLeftIcon size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages || isPending}
            >
              <CaretRightIcon size={14} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
