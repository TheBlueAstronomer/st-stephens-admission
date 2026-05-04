import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock auth ──────────────────────────────────────────────────────────────

const mockSession = { user: { id: 'u1', role: 'SYSTEM_ADMINISTRATOR', name: 'Dave', email: 'dave@ssh-dev.local' } };

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    academicProgramme: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    diocese: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    documentType: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    admissionsYear: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { requireRole, AuthorizationError } from '@/lib/require-role';

const mockAuth = auth as ReturnType<typeof vi.fn>;

// ─── US-01: Admin Screen Access Control ─────────────────────────────────────

describe('F08 US-01: Admin Screen Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows SYSTEM_ADMINISTRATOR to pass requireRole check for admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', role: 'SYSTEM_ADMINISTRATOR' },
    });

    await expect(requireRole('SYSTEM_ADMINISTRATOR')).resolves.toBeUndefined();
  });

  it('rejects ADMISSIONS_STAFF from admin routes', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u2', role: 'ADMISSIONS_STAFF' },
    });

    await expect(requireRole('SYSTEM_ADMINISTRATOR')).rejects.toThrow(AuthorizationError);
  });

  it('rejects ACADEMIC_STAFF from admin routes', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u3', role: 'ACADEMIC_STAFF' },
    });

    await expect(requireRole('SYSTEM_ADMINISTRATOR')).rejects.toThrow(AuthorizationError);
  });

  it('rejects SENIOR_LEADERSHIP from admin routes', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u4', role: 'SENIOR_LEADERSHIP' },
    });

    await expect(requireRole('SYSTEM_ADMINISTRATOR')).rejects.toThrow(AuthorizationError);
  });

  it('rejects unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);

    await expect(requireRole('SYSTEM_ADMINISTRATOR')).rejects.toThrow(AuthorizationError);
  });
});

// ─── RBAC route-level checks ────────────────────────────────────────────────

import { isRoleAllowed } from '@/lib/rbac';

describe('F08 US-01: RBAC route-level admin access', () => {
  it('allows SYSTEM_ADMINISTRATOR to access /admin', () => {
    expect(isRoleAllowed('/admin', 'SYSTEM_ADMINISTRATOR')).toBe(true);
  });

  it('allows SYSTEM_ADMINISTRATOR to access /admin/users', () => {
    expect(isRoleAllowed('/admin/users', 'SYSTEM_ADMINISTRATOR')).toBe(true);
  });

  it('blocks ADMISSIONS_STAFF from /admin', () => {
    expect(isRoleAllowed('/admin', 'ADMISSIONS_STAFF')).toBe(false);
  });

  it('blocks ACADEMIC_STAFF from /admin', () => {
    expect(isRoleAllowed('/admin', 'ACADEMIC_STAFF')).toBe(false);
  });

  it('blocks SENIOR_LEADERSHIP from /admin', () => {
    expect(isRoleAllowed('/admin', 'SENIOR_LEADERSHIP')).toBe(false);
  });

  it('blocks ADMISSIONS_STAFF from /admin/audit-log', () => {
    expect(isRoleAllowed('/admin/audit-log', 'ADMISSIONS_STAFF')).toBe(false);
  });
});
