import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    applicant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    applicantDocument: {
      findUnique: vi.fn(),
    },
    documentType: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/features/documents/services/microsoft-graph', () => ({
  uploadToSharePoint: vi.fn(),
  createSharePointFolder: vi.fn(),
}));

import { prisma } from '@/lib/db';
import {
  clearDocumentFulfilmentWorkflow,
  markDocumentReceivedWorkflow,
  uploadDocumentWorkflow,
  waiveDocumentWorkflow,
} from '@/features/documents/services/document-fulfilment';

const tx = {
  applicantDocument: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

const mockPrisma = prisma as unknown as {
  $transaction: ReturnType<typeof vi.fn>;
  applicant: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  applicantDocument: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  documentType: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

describe('Document Fulfilment workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback) => callback(tx));
    mockPrisma.documentType.findUnique.mockResolvedValue({
      id: 'doctype-1',
      name: 'Legal ID',
      isRequired: true,
    });
    tx.applicantDocument.upsert.mockResolvedValue({ id: 'doc-record-1' });
    tx.applicantDocument.update.mockResolvedValue({ id: 'doc-record-1' });
    tx.auditLog.create.mockResolvedValue({});
  });

  it('marks a document received and clears any waiver state', async () => {
    const receivedAt = new Date('2026-01-15T00:00:00.000Z');

    const result = await markDocumentReceivedWorkflow(
      {
        applicantId: 'applicant-1',
        documentTypeId: 'doctype-1',
        receivedAt,
        fileUrl: 'https://sharepoint.example/legal-id.pdf',
        fileName: 'legal-id.pdf',
        notes: 'Certified copy',
      },
      'staff-1',
    );

    expect(result.success).toBe(true);
    expect(tx.applicantDocument.upsert).toHaveBeenCalledWith({
      where: {
        applicantId_documentTypeId: {
          applicantId: 'applicant-1',
          documentTypeId: 'doctype-1',
        },
      },
      update: expect.objectContaining({
        isReceived: true,
        isWaived: false,
        receivedAt,
        storageProvider: 'SHAREPOINT',
        storageUrl: 'https://sharepoint.example/legal-id.pdf',
        fileName: 'legal-id.pdf',
        notes: 'Certified copy',
        waiverNote: null,
      }),
      create: expect.objectContaining({
        applicantId: 'applicant-1',
        documentTypeId: 'doctype-1',
        isRequired: true,
        isReceived: true,
        isWaived: false,
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicantId: 'applicant-1',
        entityType: 'ApplicantDocument',
        entityId: 'doc-record-1',
        action: 'DOCUMENT_RECEIVED',
        performedByUserId: 'staff-1',
      }),
    });
  });

  it('uploads through the storage adapter before marking a document received', async () => {
    mockPrisma.applicant.findUnique.mockResolvedValue({ applicantId: 'SSH-2026-0001' });
    const adapter = {
      upload: vi.fn().mockResolvedValue({
        fileUrl: 'https://sharepoint.example/uploaded.pdf',
        fileName: 'uploaded.pdf',
      }),
      createFolder: vi.fn(),
    };
    const file = {
      name: 'source.pdf',
      size: 100,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
    };

    const result = await uploadDocumentWorkflow(
      {
        applicantId: 'applicant-1',
        documentTypeId: 'doctype-1',
        file,
        receivedAt: new Date('2026-01-15T00:00:00.000Z'),
        notes: 'Uploaded by staff',
      },
      'staff-1',
      adapter,
    );

    expect(result).toEqual({
      success: true,
      data: { fileUrl: 'https://sharepoint.example/uploaded.pdf' },
    });
    expect(adapter.upload).toHaveBeenCalledWith(
      'SSH-2026-0001',
      'source.pdf',
      expect.any(ArrayBuffer),
    );
    expect(tx.applicantDocument.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          storageProvider: 'SHAREPOINT',
          storageUrl: 'https://sharepoint.example/uploaded.pdf',
          fileName: 'uploaded.pdf',
        }),
      }),
    );
  });

  it('waives a document and clears received file state', async () => {
    const result = await waiveDocumentWorkflow(
      {
        applicantId: 'applicant-1',
        documentTypeId: 'doctype-1',
        waiverNote: 'Equivalent document already verified',
      },
      'staff-1',
    );

    expect(result.success).toBe(true);
    expect(tx.applicantDocument.upsert).toHaveBeenCalledWith({
      where: {
        applicantId_documentTypeId: {
          applicantId: 'applicant-1',
          documentTypeId: 'doctype-1',
        },
      },
      update: {
        isWaived: true,
        isReceived: false,
        receivedAt: null,
        storageProvider: null,
        storageUrl: null,
        fileName: null,
        notes: null,
        waiverNote: 'Equivalent document already verified',
      },
      create: expect.objectContaining({
        applicantId: 'applicant-1',
        documentTypeId: 'doctype-1',
        isRequired: true,
        isWaived: true,
        isReceived: false,
        waiverNote: 'Equivalent document already verified',
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_WAIVED',
        entityId: 'doc-record-1',
      }),
    });
  });

  it('clears fulfilment back to outstanding without deleting the document row', async () => {
    mockPrisma.applicantDocument.findUnique.mockResolvedValue({
      id: 'doc-record-1',
      isReceived: true,
      isWaived: false,
      fileName: 'legal-id.pdf',
      documentType: { name: 'Legal ID' },
    });

    const result = await clearDocumentFulfilmentWorkflow(
      {
        applicantId: 'applicant-1',
        documentTypeId: 'doctype-1',
      },
      'staff-1',
    );

    expect(result.success).toBe(true);
    expect(tx.applicantDocument.update).toHaveBeenCalledWith({
      where: { id: 'doc-record-1' },
      data: {
        isReceived: false,
        isWaived: false,
        receivedAt: null,
        storageProvider: null,
        storageUrl: null,
        fileName: null,
        notes: null,
        waiverNote: null,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicantId: 'applicant-1',
        entityType: 'ApplicantDocument',
        entityId: 'doc-record-1',
        action: 'DELETE',
        performedByUserId: 'staff-1',
      }),
    });
  });
});
