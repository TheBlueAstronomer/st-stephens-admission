'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

interface FilterOption {
  id: string;
  label: string;
}

interface ReportFilterBarProps {
  filters: { [key: string]: string | undefined };
  years?: FilterOption[];
  programmes?: FilterOption[];
  statuses?: FilterOption[];
}

export function ReportFilterBar({ filters, years, programmes, statuses }: ReportFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {years && years.length > 0 && (
        <NativeSelect
          value={filters.admissionsYearId ?? ''}
          onChange={(e) => updateFilter('admissionsYearId', e.target.value || undefined)}
          aria-label="Admissions Year"
        >
          <NativeSelectOption value="">All Years</NativeSelectOption>
          {years.map((y) => (
            <NativeSelectOption key={y.id} value={y.id}>{y.label}</NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      {programmes && programmes.length > 0 && (
        <NativeSelect
          value={filters.programmeId ?? ''}
          onChange={(e) => updateFilter('programmeId', e.target.value || undefined)}
          aria-label="Programme"
        >
          <NativeSelectOption value="">All Programmes</NativeSelectOption>
          {programmes.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>{p.label}</NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      {statuses && statuses.length > 0 && (
        <NativeSelect
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value || undefined)}
          aria-label="Status"
        >
          <NativeSelectOption value="">All Statuses</NativeSelectOption>
          {statuses.map((s) => (
            <NativeSelectOption key={s.id} value={s.id}>{s.label}</NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      {isPending && (
        <span className="text-xs text-muted-foreground">Loading...</span>
      )}
    </div>
  );
}
