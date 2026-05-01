'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { MagnifyingGlassIcon, XIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/lib/constants/applicant-status';
import { exportApplicantsCSV } from '@/app/(staff)/applicants/actions';

interface ReferenceData {
  programmes: { id: string; courseTitle: string }[];
  dioceses: { id: string; name: string }[];
  admissionsYears: { id: string; label: string; isCurrent: boolean }[];
}

interface ApplicantFilterBarProps {
  filters: Record<string, string | undefined>;
  referenceData: ReferenceData;
  canExport: boolean;
}

export function ApplicantFilterBar({
  filters,
  referenceData,
  canExport,
}: ApplicantFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(filters.search ?? '');

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      startTransition(() => {
        router.push(`/applicants?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const clearAllFilters = () => {
    startTransition(() => {
      router.push('/applicants');
    });
    setSearchValue('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateFilter('search', searchValue || undefined);
    }
  };

  const handleExport = async () => {
    const result = await exportApplicantsCSV(filters);
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ssh-applicants-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const activeFilters = Object.entries(filters).filter(
    ([key, val]) => val && key !== 'page',
  );

  const statuses = Object.entries(STATUS_LABELS);

  return (
    <div className="sticky top-0 z-10 space-y-3 rounded-2xl bg-white p-4 border border-black/6 shadow-sm shadow-black/3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-60">
          <MagnifyingGlassIcon
            size={15}
            weight="light"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search name, email, ID, diocese, DDO..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => updateFilter('search', searchValue || undefined)}
            className="rounded-full pl-9 bg-[#F8F7F5] border-transparent focus:border-[#1A2744]/20 focus:bg-white h-9 text-sm"
          />
        </div>

        {/* Status filter */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value || undefined)}
          className="h-9 rounded-full border border-black/8 bg-[#F8F7F5] px-3 py-1.5 text-sm text-muted-foreground hover:border-[#1A2744]/20 focus:border-[#1A2744]/30 focus:outline-none transition-colors cursor-pointer"
        >
          <option value="">All Statuses</option>
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Year filter */}
        <select
          value={filters.admissionsYearId ?? ''}
          onChange={(e) => updateFilter('admissionsYearId', e.target.value || undefined)}
          className="h-9 rounded-full border border-black/8 bg-[#F8F7F5] px-3 py-1.5 text-sm text-muted-foreground hover:border-[#1A2744]/20 focus:border-[#1A2744]/30 focus:outline-none transition-colors cursor-pointer"
        >
          <option value="">All Years</option>
          {referenceData.admissionsYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
            </option>
          ))}
        </select>

        {/* Programme filter */}
        <select
          value={filters.programmeId ?? ''}
          onChange={(e) => updateFilter('programmeId', e.target.value || undefined)}
          className="h-9 rounded-full border border-black/8 bg-[#F8F7F5] px-3 py-1.5 text-sm text-muted-foreground hover:border-[#1A2744]/20 focus:border-[#1A2744]/30 focus:outline-none transition-colors cursor-pointer"
        >
          <option value="">All Programmes</option>
          {referenceData.programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.courseTitle}
            </option>
          ))}
        </select>

        {/* Export button */}
        {canExport && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground hover:text-[#1A2744]"
            onClick={handleExport}
          >
            <DownloadSimpleIcon size={15} weight="light" className="mr-1.5" />
            Export
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map(([key, value]) => (
            <Badge
              key={key}
              className="rounded-full bg-[#1A2744]/10 text-[#1A2744] border-0 pl-2.5 pr-1.5 py-1 text-xs font-medium transition-all"
              style={{ animation: 'chipIn 200ms both' }}
            >
              {key === 'search' ? `"${value}"` : value}
              <button
                onClick={() => {
                  updateFilter(key, undefined);
                  if (key === 'search') setSearchValue('');
                }}
                className="ml-1.5 rounded-full p-0.5 hover:bg-black/10"
              >
                <XIcon size={12} />
              </button>
            </Badge>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-[#1A2744] underline"
          >
            Clear all
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes chipIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
