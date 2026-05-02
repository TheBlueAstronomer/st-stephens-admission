import { z } from 'zod';

export const markDocumentReceivedSchema = z.object({
  applicantId:    z.string().min(1),
  documentTypeId: z.string().min(1),
  fileUrl:        z.string().url().optional(),
  fileName:       z.string().optional(),
  receivedAt:     z.coerce.date().optional(),
  notes:          z.string().optional(),
});

export const waiveDocumentSchema = z.object({
  applicantId:    z.string().min(1),
  documentTypeId: z.string().min(1),
  waiverNote:     z.string().min(1, 'Waiver note is required'),
});

export const clearDocumentStatusSchema = z.object({
  applicantId:    z.string().min(1),
  documentTypeId: z.string().min(1),
});

export type MarkDocumentReceivedInput = z.infer<typeof markDocumentReceivedSchema>;
export type WaiveDocumentInput        = z.infer<typeof waiveDocumentSchema>;
export type ClearDocumentStatusInput  = z.infer<typeof clearDocumentStatusSchema>;
