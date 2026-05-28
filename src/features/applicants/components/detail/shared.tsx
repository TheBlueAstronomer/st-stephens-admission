import { PlaceholderIcon } from '@phosphor-icons/react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import type { ApplicantDetail } from '@/features/applicants/queries/applicants';

export type ApplicantFull = ApplicantDetail;
export type ApplicantInterview = ApplicantDetail['interviews'][number];

export interface AvailableInterviewer {
  id: string;
  name: string;
  email: string;
}

export function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
      </dt>
      <dd className="mt-1 text-sm font-medium text-brand-ink">{value || '—'}</dd>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Empty className="py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PlaceholderIcon size={20} weight="light" />
        </EmptyMedia>
        <EmptyTitle>{message}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
