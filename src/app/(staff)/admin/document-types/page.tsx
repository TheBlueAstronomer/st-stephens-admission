import { prisma } from '@/lib/db';
import { DocumentTypeManagementTable } from '@/features/admin/components/document-type-management-table';

export const dynamic = 'force-dynamic';

export default async function AdminDocumentTypesPage() {
  const documentTypes = await prisma.documentType.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { documents: true } } },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1A2744]">Document Types</h2>
      <DocumentTypeManagementTable documentTypes={documentTypes} />
    </div>
  );
}
