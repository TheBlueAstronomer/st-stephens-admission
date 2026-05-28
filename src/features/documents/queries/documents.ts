import { prisma } from '@/lib/db';
import type { UserRole } from '@/generated/prisma/client';
import { isSensitiveDocument } from '@/features/documents/constants/document-types';

export interface DocumentChecklistItem {
  documentTypeId: string;
  slug:           string;
  name:           string;
  isRequired:     boolean;
  isSensitive:    boolean;
  status:         'RECEIVED' | 'WAIVED' | 'OUTSTANDING';
  recordId:       string | null;
  receivedAt:     Date | null;
  storageUrl:     string | null;
  fileName:       string | null;
  notes:          string | null;
  waiverNote:     string | null;
}

export async function getAllDocumentTypes(): Promise<{ id: string; name: string }[]> {
  return prisma.documentType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}

export async function getDocumentChecklist(
  applicantId: string,
  role: UserRole,
): Promise<DocumentChecklistItem[]> {
  const canSeeSensitive = role === 'ADMISSIONS_STAFF' || role === 'SYSTEM_ADMINISTRATOR';

  const documentTypes = await prisma.documentType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const existingDocs = await prisma.applicantDocument.findMany({
    where: { applicantId },
    include: { documentType: true },
  });

  const docMap = new Map(existingDocs.map((d) => [d.documentTypeId ?? '', d]));

  const items: DocumentChecklistItem[] = [];

  for (const dt of documentTypes) {
    if (!canSeeSensitive && isSensitiveDocument(dt.slug)) continue;

    const existing = docMap.get(dt.id);

    let status: DocumentChecklistItem['status'] = 'OUTSTANDING';
    if (existing?.isReceived) status = 'RECEIVED';
    else if (existing?.isWaived) status = 'WAIVED';

    items.push({
      documentTypeId: dt.id,
      slug:           dt.slug,
      name:           dt.name,
      isRequired:     dt.isRequired,
      isSensitive:    dt.isSensitive,
      status,
      recordId:   existing?.id ?? null,
      receivedAt: existing?.receivedAt ?? null,
      storageUrl: existing?.storageUrl ?? null,
      fileName:   existing?.fileName ?? null,
      notes:      existing?.notes ?? null,
      waiverNote: existing?.waiverNote ?? null,
    });
  }

  return items;
}

export interface MissingDocumentEntry {
  applicantId:      string;
  applicantDisplayId: string;
  legalName:        string;
  missingDocuments: string[];
}

export interface MissingDocumentsFilter {
  admissionsYearId?: string;
  programmeId?:      string;
  status?:           string;
}

export async function getMissingDocuments(
  filter: MissingDocumentsFilter = {},
): Promise<MissingDocumentEntry[]> {
  const applicants = await prisma.applicant.findMany({
    where: {
      ...(filter.admissionsYearId ? { admissionsYearId: filter.admissionsYearId } : {}),
      ...(filter.programmeId      ? { programmeId:      filter.programmeId }      : {}),
      ...(filter.status           ? { status: filter.status as never }             : {}),
    },
    include: {
      documents: {
        include: { documentType: true },
      },
    },
  });

  const allRequiredTypes = await prisma.documentType.findMany({
    where: { isActive: true, isRequired: true },
  });

  const result: MissingDocumentEntry[] = [];

  for (const applicant of applicants) {
    const receivedOrWaivedIds = new Set(
      applicant.documents
        .filter((d) => d.isReceived || d.isWaived)
        .map((d) => d.documentTypeId)
        .filter(Boolean),
    );

    const missing = allRequiredTypes
      .filter((dt) => !receivedOrWaivedIds.has(dt.id))
      .map((dt) => dt.name);

    if (missing.length > 0) {
      result.push({
        applicantId:        applicant.id,
        applicantDisplayId: applicant.applicantId,
        legalName:          applicant.legalName,
        missingDocuments:   missing,
      });
    }
  }

  return result;
}
