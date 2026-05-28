import { prisma } from '@/lib/db';
import { serializeAuditFields } from '@/lib/audit-log';
import { createSharePointFolder, uploadToSharePoint } from '@/features/documents/services/microsoft-graph';
import type {
  ClearDocumentStatusInput,
  MarkDocumentReceivedInput,
  WaiveDocumentInput,
} from '@/features/documents/validations/document';

export interface DocumentFulfilmentResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadableDocumentFile {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export interface DocumentStorageAdapter {
  upload: (
    applicantDisplayId: string,
    fileName: string,
    fileBuffer: ArrayBuffer,
  ) => Promise<{ fileUrl: string; fileName: string }>;
  createFolder: (applicantDisplayId: string) => Promise<{ folderUrl: string }>;
}

const sharePointStorageAdapter: DocumentStorageAdapter = {
  upload: uploadToSharePoint,
  createFolder: createSharePointFolder,
};

function receivedDocumentData(input: {
  receivedAt?: Date;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
}) {
  return {
    isReceived: true,
    isWaived: false,
    receivedAt: input.receivedAt ?? new Date(),
    storageUrl: input.fileUrl ?? null,
    fileName: input.fileName ?? null,
    notes: input.notes ?? null,
    waiverNote: null,
    storageProvider: input.fileUrl ? 'SHAREPOINT' : null,
  };
}

export async function markDocumentReceivedWorkflow(
  input: MarkDocumentReceivedInput,
  performedByUserId?: string | null,
): Promise<DocumentFulfilmentResult> {
  const documentType = await prisma.documentType.findUnique({
    where: { id: input.documentTypeId },
  });
  if (!documentType) {
    return { success: false, error: 'Document type not found.' };
  }

  const documentData = receivedDocumentData(input);

  await prisma.$transaction(async (tx) => {
    const document = await tx.applicantDocument.upsert({
      where: {
        applicantId_documentTypeId: {
          applicantId: input.applicantId,
          documentTypeId: input.documentTypeId,
        },
      },
      update: documentData,
      create: {
        applicantId: input.applicantId,
        documentTypeId: input.documentTypeId,
        isRequired: documentType.isRequired,
        ...documentData,
      },
    });

    await tx.auditLog.create({
      data: {
        applicantId: input.applicantId,
        entityType: 'ApplicantDocument',
        entityId: document.id,
        action: 'DOCUMENT_RECEIVED',
        newValue: serializeAuditFields('Document marked received', {
          documentType: documentType.name,
          fileUrl: input.fileUrl ?? null,
          fileName: input.fileName ?? null,
        }),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true };
}

export async function uploadDocumentWorkflow(
  input: {
    applicantId: string;
    documentTypeId: string;
    file: UploadableDocumentFile | null;
    receivedAt?: Date;
    notes?: string | null;
  },
  performedByUserId?: string | null,
  storageAdapter: DocumentStorageAdapter = sharePointStorageAdapter,
): Promise<DocumentFulfilmentResult<{ fileUrl: string }>> {
  if (!input.applicantId || !input.documentTypeId) {
    return { success: false, error: 'applicantId and documentTypeId are required.' };
  }

  const applicant = await prisma.applicant.findUnique({
    where: { id: input.applicantId },
    select: { applicantId: true },
  });
  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  let fileUrl: string | undefined;
  let fileName: string | undefined;

  if (input.file && input.file.size > 0) {
    const arrayBuffer = await input.file.arrayBuffer();
    const uploaded = await storageAdapter.upload(applicant.applicantId, input.file.name, arrayBuffer);
    fileUrl = uploaded.fileUrl;
    fileName = uploaded.fileName;
  }

  const result = await markDocumentReceivedWorkflow(
    {
      applicantId: input.applicantId,
      documentTypeId: input.documentTypeId,
      receivedAt: input.receivedAt,
      notes: input.notes ?? undefined,
      fileUrl,
      fileName,
    },
    performedByUserId,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: { fileUrl: fileUrl ?? '' } };
}

export async function waiveDocumentWorkflow(
  input: WaiveDocumentInput,
  performedByUserId?: string | null,
): Promise<DocumentFulfilmentResult> {
  const waiverNote = input.waiverNote.trim();
  if (!waiverNote) {
    return { success: false, error: 'Waiver note is required.' };
  }

  const documentType = await prisma.documentType.findUnique({
    where: { id: input.documentTypeId },
  });
  if (!documentType) {
    return { success: false, error: 'Document type not found.' };
  }

  await prisma.$transaction(async (tx) => {
    const document = await tx.applicantDocument.upsert({
      where: {
        applicantId_documentTypeId: {
          applicantId: input.applicantId,
          documentTypeId: input.documentTypeId,
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
        waiverNote,
      },
      create: {
        applicantId: input.applicantId,
        documentTypeId: input.documentTypeId,
        isRequired: documentType.isRequired,
        isWaived: true,
        isReceived: false,
        waiverNote,
      },
    });

    await tx.auditLog.create({
      data: {
        applicantId: input.applicantId,
        entityType: 'ApplicantDocument',
        entityId: document.id,
        action: 'DOCUMENT_WAIVED',
        newValue: serializeAuditFields('Document requirement waived', {
          documentType: documentType.name,
          waiverNote,
        }),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true };
}

export async function clearDocumentFulfilmentWorkflow(
  input: ClearDocumentStatusInput,
  performedByUserId?: string | null,
): Promise<DocumentFulfilmentResult> {
  const existing = await prisma.applicantDocument.findUnique({
    where: {
      applicantId_documentTypeId: {
        applicantId: input.applicantId,
        documentTypeId: input.documentTypeId,
      },
    },
    include: { documentType: { select: { name: true } } },
  });

  if (!existing) {
    return { success: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.applicantDocument.update({
      where: { id: existing.id },
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

    await tx.auditLog.create({
      data: {
        applicantId: input.applicantId,
        entityType: 'ApplicantDocument',
        entityId: existing.id,
        action: 'DELETE',
        previousValue: serializeAuditFields('Document fulfilment cleared', {
          documentType: existing.documentType?.name ?? 'Unknown document',
          wasReceived: existing.isReceived,
          wasWaived: existing.isWaived,
          fileName: existing.fileName,
        }),
        performedByUserId: performedByUserId ?? null,
      },
    });
  });

  return { success: true };
}

export async function ensureSharePointFolderWorkflow(
  applicantId: string,
  storageAdapter: DocumentStorageAdapter = sharePointStorageAdapter,
): Promise<DocumentFulfilmentResult<{ folderUrl: string }>> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { applicantId: true, sharePointFolderUrl: true },
  });
  if (!applicant) {
    return { success: false, error: 'Applicant not found.' };
  }

  if (applicant.sharePointFolderUrl) {
    return { success: true, data: { folderUrl: applicant.sharePointFolderUrl } };
  }

  const { folderUrl } = await storageAdapter.createFolder(applicant.applicantId);

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { sharePointFolderUrl: folderUrl },
  });

  return { success: true, data: { folderUrl } };
}
