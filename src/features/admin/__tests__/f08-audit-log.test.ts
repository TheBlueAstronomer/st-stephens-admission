import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'admin-1', role: 'SYSTEM_ADMINISTRATOR' } })),
}));

const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    academicProgramme: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    diocese: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    documentType: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    admissionsYear: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}));

import { getAuditLogEntries } from '@/features/admin/queries/audit-log';

// ─── US-09: Audit Log Viewer ────────────────────────────────────────────────

describe('F08 US-09: Audit Log Viewer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated audit log entries', async () => {
    const mockEntries = [
      {
        id: 'al-1',
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: 'u1',
        performedAt: new Date(),
        user: { id: 'admin-1', name: 'Dave', email: 'dave@test.com' },
        applicant: null,
      },
    ];

    mockFindMany.mockResolvedValue(mockEntries);
    mockCount.mockResolvedValue(1);

    const result = await getAuditLogEntries({ page: 1 });

    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('filters by action', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await getAuditLogEntries({ action: 'USER_CREATED' });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: 'USER_CREATED' }),
      }),
    );
  });

  it('filters by entityType', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await getAuditLogEntries({ entityType: 'User' });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entityType: 'User' }),
      }),
    );
  });

  it('filters by userId', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await getAuditLogEntries({ userId: 'admin-1' });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ performedByUserId: 'admin-1' }),
      }),
    );
  });

  it('sorts by performedAt desc (most recent first)', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await getAuditLogEntries({});

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { performedAt: 'desc' },
      }),
    );
  });

  it('paginates with correct offset', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(50);

    const result = await getAuditLogEntries({ page: 2 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 25,
        take: 25,
      }),
    );
    expect(result.totalPages).toBe(2);
  });
});

// ─── US-10: Audit Log Immutability ──────────────────────────────────────────

describe('F08 US-10: Audit Log Immutability', () => {
  it('audit log query module has no update or delete exports', async () => {
    const auditLogModule = await import('@/features/admin/queries/audit-log');
    const exportedNames = Object.keys(auditLogModule);

    const mutationNames = exportedNames.filter((name) =>
      /update|delete|remove|edit|modify|mutate/i.test(name),
    );

    expect(mutationNames).toEqual([]);
  });

  it('no server action file exposes audit log mutations', async () => {
    const adminModules = [
      '@/features/admin/actions/user-actions',
      '@/features/admin/actions/programme-actions',
      '@/features/admin/actions/diocese-actions',
      '@/features/admin/actions/document-type-actions',
      '@/features/admin/actions/admissions-year-actions',
    ];

    for (const modPath of adminModules) {
      const mod = await import(modPath);
      const names = Object.keys(mod);
      const auditMutations = names.filter((name) =>
        /deleteAudit|updateAudit|removeAudit|editAudit/i.test(name),
      );
      expect(auditMutations).toEqual([]);
    }
  });

  it('getAuditLogEntries only reads data (does not call create/update/delete)', async () => {
    const { prisma } = await import('@/lib/db');
    const db = prisma as unknown as {
      auditLog: {
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
        deleteMany: ReturnType<typeof vi.fn>;
      };
    };

    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await getAuditLogEntries({ page: 1 });

    expect(db.auditLog.create).not.toHaveBeenCalled();
    expect(db.auditLog.update).not.toHaveBeenCalled();
    expect(db.auditLog.delete).not.toHaveBeenCalled();
    expect(db.auditLog.deleteMany).not.toHaveBeenCalled();
  });
});
