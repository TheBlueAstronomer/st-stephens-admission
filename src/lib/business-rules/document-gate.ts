export interface DocumentGateResult {
  allowed: boolean;
  missingDocuments: string[];
}

type ApplicantDocumentCheck = {
  isRequired: boolean;
  isReceived: boolean;
  isWaived: boolean;
  documentType?: { name: string } | null;
  fileName?: string | null;
};

/**
 * Validates whether all mandatory documents are satisfied (received or waived).
 * Returns blocked state with list of unsatisfied document names.
 */
export function validateDocumentGate(documents: ApplicantDocumentCheck[]): DocumentGateResult {
  const missingDocuments = documents
    .filter((doc) => doc.isRequired && !doc.isReceived && !doc.isWaived)
    .map((doc) => doc.documentType?.name ?? doc.fileName ?? 'Unknown document');

  return {
    allowed: missingDocuments.length === 0,
    missingDocuments,
  };
}
