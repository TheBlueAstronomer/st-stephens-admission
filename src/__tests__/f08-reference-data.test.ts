import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'admin-1', role: 'SYSTEM_ADMINISTRATOR' } })),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    academicProgramme: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    diocese: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    documentType: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    admissionsYear: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const db = prisma as unknown as {
  academicProgramme: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  diocese: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  documentType: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  admissionsYear: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  auditLog: { create: ReturnType<typeof vi.fn> };
};

// ─── US-05: Programmes ──────────────────────────────────────────────────────

import { createProgramme, updateProgramme } from '@/app/(staff)/admin/programmes/actions';

describe('F08 US-05: Manage Academic Programmes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a new programme and writes audit log', async () => {
    db.academicProgramme.create.mockResolvedValue({
      id: 'prog-1', courseTitle: 'BA Theology', awardingFramework: 'COMMON_AWARDS', isActive: true,
    });
    db.auditLog.create.mockResolvedValue({});

    const result = await createProgramme({
      courseTitle: 'BA Theology',
      awardingFramework: 'COMMON_AWARDS',
      modeOfStudy: 'FULL_TIME',
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('prog-1');
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'PROGRAMME_CREATED' }),
    });
  });

  it('rejects empty course title', async () => {
    const result = await createProgramme({
      courseTitle: '  ',
      awardingFramework: 'COMMON_AWARDS',
      modeOfStudy: 'FULL_TIME',
    });
    expect(result.success).toBe(false);
  });

  it('soft-deactivates a programme', async () => {
    db.academicProgramme.findUnique.mockResolvedValue({ id: 'prog-1', courseTitle: 'BA', isActive: true });
    db.academicProgramme.update.mockResolvedValue({ id: 'prog-1', courseTitle: 'BA', isActive: false });
    db.auditLog.create.mockResolvedValue({});

    const result = await updateProgramme('prog-1', { isActive: false });
    expect(result.success).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'PROGRAMME_DEACTIVATED' }),
    });
  });
});

// ─── US-06: Dioceses ────────────────────────────────────────────────────────

import { createDiocese, updateDiocese } from '@/app/(staff)/admin/dioceses/actions';

describe('F08 US-06: Manage Dioceses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a new diocese', async () => {
    db.diocese.findUnique.mockResolvedValue(null);
    db.diocese.create.mockResolvedValue({ id: 'dio-1', name: 'Oxford' });
    db.auditLog.create.mockResolvedValue({});

    const result = await createDiocese('Oxford');

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('dio-1');
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'DIOCESE_CREATED' }),
    });
  });

  it('rejects duplicate diocese name', async () => {
    db.diocese.findUnique.mockResolvedValue({ id: 'existing', name: 'Oxford' });

    const result = await createDiocese('Oxford');

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('renames a diocese and logs old + new value', async () => {
    db.diocese.findUnique.mockImplementation(({ where }: { where: { id?: string; name?: string } }) => {
      if (where.id) return Promise.resolve({ id: 'dio-1', name: 'Oxford' });
      if (where.name === 'Canterbury') return Promise.resolve(null);
      return Promise.resolve(null);
    });
    db.diocese.update.mockResolvedValue({ id: 'dio-1', name: 'Canterbury' });
    db.auditLog.create.mockResolvedValue({});

    const result = await updateDiocese('dio-1', 'Canterbury');

    expect(result.success).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DIOCESE_UPDATED',
        previousValue: 'Oxford',
        newValue: 'Canterbury',
      }),
    });
  });
});

// ─── US-07: Document Types ──────────────────────────────────────────────────

import { createDocumentType, updateDocumentType } from '@/app/(staff)/admin/document-types/actions';

describe('F08 US-07: Configure Document Types', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a new document type with isRequired and isSensitive flags', async () => {
    db.documentType.findUnique.mockResolvedValue(null);
    db.documentType.create.mockResolvedValue({
      id: 'dt-1', name: 'DBS Check', slug: 'DBS_CHECK', isRequired: true, isSensitive: true, isActive: true,
    });
    db.auditLog.create.mockResolvedValue({});

    const result = await createDocumentType({
      name: 'DBS Check',
      slug: 'DBS_CHECK',
      isRequired: true,
      isSensitive: true,
    });

    expect(result.success).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'DOCUMENT_TYPE_CREATED' }),
    });
  });

  it('rejects duplicate slug', async () => {
    db.documentType.findUnique.mockImplementation(({ where }: { where: { slug?: string; name?: string } }) => {
      if (where.slug) return Promise.resolve({ id: 'existing' });
      return Promise.resolve(null);
    });

    const result = await createDocumentType({
      name: 'DBS Check',
      slug: 'DBS_CHECK',
      isRequired: true,
      isSensitive: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('key already exists');
  });

  it('updates flags and records audit', async () => {
    db.documentType.findUnique.mockResolvedValue({
      id: 'dt-1', name: 'DBS', isRequired: true, isSensitive: true,
    });
    db.documentType.update.mockResolvedValue({
      id: 'dt-1', name: 'DBS', isRequired: false, isSensitive: true,
    });
    db.auditLog.create.mockResolvedValue({});

    const result = await updateDocumentType('dt-1', { isRequired: false });

    expect(result.success).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'DOCUMENT_TYPE_UPDATED' }),
    });
  });
});

// ─── US-08: Admissions Years ────────────────────────────────────────────────

import { createAdmissionsYear, setCurrentYear } from '@/app/(staff)/admin/admissions-years/actions';

describe('F08 US-08: Manage Admissions Years', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a new year and records audit log', async () => {
    db.admissionsYear.create.mockResolvedValue({
      id: 'y-1', label: '2026/27', isCurrent: false,
    });
    db.auditLog.create.mockResolvedValue({});

    const result = await createAdmissionsYear({
      label: '2026/27',
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      isCurrent: false,
    });

    expect(result.success).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ADMISSIONS_YEAR_CREATED' }),
    });
  });

  it('clears previous current when creating new current year', async () => {
    db.admissionsYear.updateMany.mockResolvedValue({ count: 1 });
    db.admissionsYear.create.mockResolvedValue({
      id: 'y-2', label: '2027/28', isCurrent: true,
    });
    db.auditLog.create.mockResolvedValue({});

    const result = await createAdmissionsYear({
      label: '2027/28',
      startDate: '2027-09-01',
      endDate: '2028-08-31',
      isCurrent: true,
    });

    expect(result.success).toBe(true);
    expect(db.admissionsYear.updateMany).toHaveBeenCalledWith({
      where: { isCurrent: true },
      data: { isCurrent: false },
    });
  });

  it('rejects end date before start date', async () => {
    const result = await createAdmissionsYear({
      label: 'Bad',
      startDate: '2027-09-01',
      endDate: '2026-01-01',
      isCurrent: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('after start');
  });

  it('sets a year as current and unsets previous', async () => {
    db.admissionsYear.findUnique.mockResolvedValue({ id: 'y-1', label: '2026/27', isCurrent: false });
    db.admissionsYear.updateMany.mockResolvedValue({ count: 1 });
    db.admissionsYear.update.mockResolvedValue({ id: 'y-1', isCurrent: true });
    db.auditLog.create.mockResolvedValue({});

    const result = await setCurrentYear('y-1');

    expect(result.success).toBe(true);
    expect(db.admissionsYear.updateMany).toHaveBeenCalledWith({
      where: { isCurrent: true },
      data: { isCurrent: false },
    });
  });
});
