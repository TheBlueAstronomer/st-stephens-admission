import type { AuditAction, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';

const PAGE_SIZE = 25;

export interface AuditLogFilterParams {
  action?: AuditAction;
  entityType?: string;
  userId?: string;
  page?: number;
}

export async function getAuditLogEntries(filters: AuditLogFilterParams) {
  const page = filters.page ?? 1;
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.AuditLogWhereInput = {};
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.userId) where.performedByUserId = filters.userId;

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        applicant: { select: { id: true, legalName: true } },
      },
      orderBy: { performedAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    entries,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getAuditLogFilterOptions() {
  const [users, entityTypes, actions] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.auditLog.findMany({
      distinct: ['entityType'],
      select: { entityType: true },
      orderBy: { entityType: 'asc' },
    }),
    prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    }),
  ]);

  return {
    users,
    entityTypes: entityTypes.map((e) => e.entityType),
    actions: actions.map((a) => a.action),
  };
}
