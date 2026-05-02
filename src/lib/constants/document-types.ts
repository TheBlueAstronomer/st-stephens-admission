export interface DocumentTypeConfig {
  slug: string;
  name: string;
  isSensitive: boolean;
  isRequired: boolean;
}

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  { slug: 'GCSE_TRANSCRIPT',      name: 'GCSE Transcript',          isSensitive: false, isRequired: true  },
  { slug: 'A_LEVEL_TRANSCRIPT',   name: 'A-Level Transcript',       isSensitive: false, isRequired: true  },
  { slug: 'UNDERGRAD_TRANSCRIPT', name: 'Undergraduate Transcript',  isSensitive: false, isRequired: true  },
  { slug: 'POSTGRAD_TRANSCRIPT',  name: 'Postgraduate Transcript',   isSensitive: false, isRequired: false },
  { slug: 'STAGE1_BAP_REPORT',    name: 'Stage 1 BAP Report',        isSensitive: false, isRequired: true  },
  { slug: 'STAGE2_BAP_REPORT',    name: 'Stage 2 BAP Report',        isSensitive: false, isRequired: true  },
  { slug: 'ACADEMIC_REF_1',       name: 'Academic Reference 1',      isSensitive: false, isRequired: true  },
  { slug: 'ACADEMIC_REF_2',       name: 'Academic Reference 2',      isSensitive: false, isRequired: true  },
  { slug: 'PASTORAL_REF',         name: 'Pastoral Reference',        isSensitive: false, isRequired: true  },
  { slug: 'PASSPORT_PHOTO',       name: 'Passport Photo',            isSensitive: false, isRequired: true  },
  { slug: 'LEGAL_ID',             name: 'Legal ID',                  isSensitive: true,  isRequired: true  },
  { slug: 'DBS_CHECK',            name: 'DBS Check',                 isSensitive: true,  isRequired: true  },
  { slug: 'INTERVIEW_NOTES',      name: 'Interview Notes',           isSensitive: false, isRequired: false },
  { slug: 'MEDICAL_DECLARATION',  name: 'Medical Declaration',       isSensitive: true,  isRequired: true  },
];

export const SENSITIVE_SLUGS = new Set(
  DOCUMENT_TYPES.filter((d) => d.isSensitive).map((d) => d.slug),
);

export function isSensitiveDocument(slug: string): boolean {
  return SENSITIVE_SLUGS.has(slug);
}
