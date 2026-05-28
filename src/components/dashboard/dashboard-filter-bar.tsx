'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { STATUS_LABELS } from '@/lib/constants/applicant-status';
import type { DashboardFilterParams } from '@/lib/queries/dashboard';

interface ReferenceData {
  programmes: { id: string; courseTitle: string }[];
  dioceses: { id: string; name: string }[];
  admissionsYears: { id: string; label: string; isCurrent: boolean }[];
}

interface DashboardFilterBarProps {
  filters: DashboardFilterParams;
  referenceData: ReferenceData;
}

export function DashboardFilterBar({ filters, referenceData }: DashboardFilterBarProps) {
  const router = useRouter();
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
        router.push(`/dashboard?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const clearAllFilters = () => {
    startTransition(() => {
      router.push('/dashboard');
    });
  };

  const activeFilters = Object.entries(filters).filter(([, val]) => val);
  const statuses = Object.entries(STATUS_LABELS);

  return (
    <div
      className="sticky top-0 z-10 space-y-3 rounded-2xl bg-white p-4 border border-black/6 shadow-sm shadow-black/3"
      data-testid="dashboard-filter-bar"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Year filter */}
        <NativeSelect
          value={filters.admissionsYearId ?? ''}
          onChange={(e) => updateFilter('admissionsYearId', e.target.value || undefined)}
          aria-label="Admissions Year"
        >
          <NativeSelectOption value="">All Years</NativeSelectOption>
          {referenceData.admissionsYears.map((y) => (
            <NativeSelectOption key={y.id} value={y.id}>{y.label}</NativeSelectOption>
          ))}
        </NativeSelect>

        {/* Programme filter */}
        <NativeSelect
          value={filters.programmeId ?? ''}
          onChange={(e) => updateFilter('programmeId', e.target.value || undefined)}
          aria-label="Programme"
        >
          <NativeSelectOption value="">All Programmes</NativeSelectOption>
          {referenceData.programmes.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>{p.courseTitle}</NativeSelectOption>
          ))}
        </NativeSelect>

        {/* Diocese filter */}
        <NativeSelect
          value={filters.dioceseId ?? ''}
          onChange={(e) => updateFilter('dioceseId', e.target.value || undefined)}
          aria-label="Diocese"
        >
          <NativeSelectOption value="">All Dioceses</NativeSelectOption>
          {referenceData.dioceses.map((d) => (
            <NativeSelectOption key={d.id} value={d.id}>{d.name}</NativeSelectOption>
          ))}
        </NativeSelect>

        {/* Status filter */}
        <NativeSelect
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value || undefined)}
          aria-label="Status"
        >
          <NativeSelectOption value="">All Statuses</NativeSelectOption>
          {statuses.map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>
          ))}
        </NativeSelect>

        {/* Clear all */}
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
            onClick={clearAllFilters}
            data-testid="clear-filters"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map(([key, value]) => (
            <Badge
              key={key}
              className="rounded-full border-0 bg-brand-ink/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-brand-ink"
            >
              {value}
              <button
                onClick={() => updateFilter(key, undefined)}
                className="ml-1.5 rounded-full p-0.5 transition-[transform,background-color] duration-150 ease-out hover:bg-black/10 active:scale-[0.97] motion-reduce:transition-none"
              >
                <XIcon size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Pending overlay */}
      {isPending && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-white/50" />
      )}
    </div>
  );
}
