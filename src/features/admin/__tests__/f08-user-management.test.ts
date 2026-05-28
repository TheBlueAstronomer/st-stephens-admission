import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock next/cache ────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ─── Mock auth ──────────────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({ user: { id: 'admin-1', role: 'SYSTEM_ADMINISTRATOR' } }),
  ),
}));

// ─── Mock Prisma ────────────────────────────────────────────────────────────
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { createUser, deactivateUser, reactivateUser, updateUserRole } from '@/features/admin/actions/user-actions';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  auditLog: {
    create: ReturnType<typeof vi.fn>;
  };
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('F08 US-02: Create Staff User', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a user with valid data and records an audit log', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-1',
      name: 'Test User',
      email: 'test@ssh.ox.ac.uk',
      role: 'ADMISSIONS_STAFF',
      isActive: true,
    });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const result = await createUser({
      name: 'Test User',
      email: 'test@ssh.ox.ac.uk',
      role: 'ADMISSIONS_STAFF',
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('new-user-1');

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        email: 'test@ssh.ox.ac.uk',
        role: 'ADMISSIONS_STAFF',
        isActive: true,
      },
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: 'User',
        action: 'USER_CREATED',
        performedByUserId: 'admin-1',
      }),
    });
  });

  it('rejects duplicate emails', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'dup@ssh.ox.ac.uk' });

    const result = await createUser({
      name: 'Dup User',
      email: 'dup@ssh.ox.ac.uk',
      role: 'ADMISSIONS_STAFF',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects invalid input', async () => {
    const result = await createUser({
      name: '',
      email: 'not-an-email',
      role: 'ADMISSIONS_STAFF',
    });

    expect(result.success).toBe(false);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});

describe('F08 US-03: Deactivate Staff User', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deactivates an active user and records audit log', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: true, name: 'Alice' });
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', isActive: false });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const result = await deactivateUser('u1');

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { isActive: false },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'USER_DEACTIVATED',
        previousValue: 'active',
        newValue: 'inactive',
      }),
    });
  });

  it('rejects deactivation of already inactive user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2', isActive: false });

    const result = await deactivateUser('u2');

    expect(result.success).toBe(false);
    expect(result.error).toContain('already inactive');
  });

  it('returns error for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await deactivateUser('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('F08 US-03: Reactivate Staff User', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reactivates an inactive user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2', isActive: false, name: 'Bob' });
    mockPrisma.user.update.mockResolvedValue({ id: 'u2', isActive: true });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const result = await reactivateUser('u2');

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u2' },
      data: { isActive: true },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'USER_REACTIVATED',
      }),
    });
  });
});

describe('F08 US-04: Reassign User Role', () => {
  beforeEach(() => vi.clearAllMocks());

  it('changes role and records audit log with previous and new values', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u3', role: 'ACADEMIC_STAFF' });
    mockPrisma.user.update.mockResolvedValue({ id: 'u3', role: 'ADMISSIONS_STAFF' });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const result = await updateUserRole({
      userId: 'u3',
      newRole: 'ADMISSIONS_STAFF',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u3' },
      data: { role: 'ADMISSIONS_STAFF' },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'ROLE_CHANGED',
        previousValue: 'ACADEMIC_STAFF',
        newValue: 'ADMISSIONS_STAFF',
      }),
    });
  });

  it('rejects changing to the same role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u3', role: 'ADMISSIONS_STAFF' });

    const result = await updateUserRole({
      userId: 'u3',
      newRole: 'ADMISSIONS_STAFF',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already set');
  });
});
