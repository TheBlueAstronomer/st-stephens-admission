import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants/applicant-status';
import type { ApplicantStatus } from '@/generated/prisma/client';

interface StatusBadgeProps {
  status: ApplicantStatus;
  size?: 'sm' | 'lg';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <Badge
      className={`border-0 font-medium ${size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </Badge>
  );
}
