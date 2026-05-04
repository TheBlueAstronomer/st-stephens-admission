import type { AuditAction } from '@/generated/prisma/client';
import { getAuditLogEntries, getAuditLogFilterOptions } from '@/lib/queries/audit-log';
import { AuditLogTable } from '@/components/admin/audit-log-table';

export const dynamic = 'force-dynamic';

interface AuditLogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAuditLogPage({ searchParams }: AuditLogPageProps) {
  const params = await searchParams;
  const action = typeof params.action === 'string' ? (params.action as AuditAction) : undefined;
  const entityType = typeof params.entityType === 'string' ? params.entityType : undefined;
  const userId = typeof params.userId === 'string' ? params.userId : undefined;
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page, 10)) : 1;

  const [data, filterOptions] = await Promise.all([
    getAuditLogEntries({ action, entityType, userId, page }),
    getAuditLogFilterOptions(),
  ]);

  const entries = data.entries.map((e) => ({
    ...e,
    entityId: e.entityId as string | null,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1A2744]">Audit Log</h2>
      <AuditLogTable
        entries={entries}
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        filterOptions={filterOptions}
      />
    </div>
  );
}
