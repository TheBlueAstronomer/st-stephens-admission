'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { CloudArrowUpIcon, FileIcon, UploadSimpleIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { markDocumentReceived, uploadDocument } from '@/app/(staff)/applicants/[id]/document-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface DocTypeOption {
  id: string;
  name: string;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantId: string;
  documentTypeId: string;
  documentName: string;
  hasSharePointFolder: boolean;
  availableDocTypes?: DocTypeOption[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  applicantId,
  documentTypeId: initialDocTypeId,
  documentName,
  hasSharePointFolder,
  availableDocTypes = [],
}: UploadDocumentDialogProps) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [selectedDocTypeId, setSelectedDocTypeId] = useState(initialDocTypeId);
  const [pickedFile,        setPickedFile]        = useState<File | null>(null);
  const [dragOver,          setDragOver]          = useState(false);
  const [uploadPct,         setUploadPct]         = useState<number | null>(null);
  const [uploadStatus,      setUploadStatus]      = useState('');
  const [notes,             setNotes]             = useState('');
  const [receivedAt,        setReceivedAt]        = useState('');
  const [error,             setError]             = useState<string | null>(null);

  function reset() {
    setSelectedDocTypeId(initialDocTypeId);
    setPickedFile(null);
    setDragOver(false);
    setUploadPct(null);
    setUploadStatus('');
    setNotes('');
    setReceivedAt('');
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function acceptFile(file: File | undefined) {
    if (!file) return;
    setPickedFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDocTypeId) {
      setError('Please select a document type.');
      return;
    }
    setError(null);

    const resolvedName =
      availableDocTypes.find((d) => d.id === selectedDocTypeId)?.name ?? documentName;

    startTransition(async () => {
      let result;

      if (pickedFile && hasSharePointFolder) {
        setUploadPct(0);
        setUploadStatus('Sending to SharePoint folder…');

        const formData = new FormData();
        formData.append('applicantId', applicantId);
        formData.append('documentTypeId', selectedDocTypeId);
        formData.append('file', pickedFile);
        if (notes)      formData.append('notes', notes);
        if (receivedAt) formData.append('receivedAt', receivedAt);

        const progressInterval = setInterval(() => {
          setUploadPct((prev) => (prev !== null && prev < 90 ? prev + 12 : prev));
        }, 200);

        result = await uploadDocument(formData);
        clearInterval(progressInterval);
        setUploadPct(100);
        setUploadStatus('Saved to SharePoint ✓');
      } else {
        result = await markDocumentReceived({
          applicantId,
          documentTypeId: selectedDocTypeId,
          fileName:   pickedFile?.name || undefined,
          notes:      notes || undefined,
          receivedAt: receivedAt ? new Date(receivedAt) : undefined,
        });
      }

      if (result.success) {
        toast.success(`"${resolvedName}" marked as received.`);
        handleClose();
        router.refresh();
      } else {
        setUploadPct(null);
        setUploadStatus('');
        setError(result.error ?? 'Failed to save document.');
      }
    });
  }

  // Show the selector only when no type was pre-selected (no row context).
  const showDocTypeSelect = !initialDocTypeId && availableDocTypes.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="pb-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Documents
          </p>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UploadSimpleIcon size={16} weight="bold" className="text-brand-ink" />
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          {/* Pre-selected document name (row context) */}
          {initialDocTypeId && documentName && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Document</p>
              <p className="text-sm font-medium text-brand-ink">{documentName}</p>
            </div>
          )}

          {/* Document Type select (no row context) */}
          {showDocTypeSelect && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-type" className="text-xs font-medium">
                Document Type <span className="text-destructive">*</span>
              </Label>
              <NativeSelect
                id="doc-type"
                className="w-full"
                value={selectedDocTypeId}
                onChange={(e) => setSelectedDocTypeId(e.target.value)}
                required
                aria-invalid={!selectedDocTypeId && error !== null}
              >
                <NativeSelectOption value="">Select type…</NativeSelectOption>
                {availableDocTypes.map((dt) => (
                  <NativeSelectOption key={dt.id} value={dt.id}>
                    {dt.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}

          {/* Hidden file input — triggered via label to preserve trusted event context */}
          <input
            ref={fileRef}
            id="doc-file-input"
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />

          {/* Drop zone */}
          <div
            aria-label="File drop zone"
            className={`relative flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed px-6 py-7 text-center transition-colors ${
              dragOver
                ? 'border-brand-ink bg-brand-ink/5'
                : 'border-black/15'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {pickedFile ? (
              <>
                <FileIcon size={28} weight="duotone" className="text-brand-ink" />
                <div>
                  <p className="text-sm font-semibold text-brand-ink">{pickedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(pickedFile.size)}</p>
                </div>
                <button
                  type="button"
                  aria-label="Remove file"
                  className="absolute top-3 right-3 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={() => { setPickedFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                >
                  <XIcon size={14} />
                </button>
              </>
            ) : (
              <>
                <CloudArrowUpIcon size={30} weight="light" className="text-muted-foreground/60" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Drag &amp; drop file here, or
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    PDF, JPG, PNG, DOCX · max 20 MB
                  </p>
                </div>
                <label
                  htmlFor="doc-file-input"
                  className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-background px-3 h-7 text-xs font-medium transition-colors hover:bg-muted hover:text-foreground"
                >
                  Browse files
                </label>
              </>
            )}
          </div>

          {/* Upload progress */}
          {uploadPct !== null && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-black/6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-ink transition-[width] duration-300 ease-out"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{uploadStatus}</p>
            </div>
          )}

          {/* Received date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-received-at" className="text-xs font-medium">
              Received Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="doc-received-at"
              type="date"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              required
              className="text-sm"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-notes" className="text-xs font-medium">
              Notes{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="doc-notes"
              placeholder="Optional notes about this document…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        <DialogFooter className="border-t border-black/6 pt-3">
          <Button
            variant="outline"
            type="button"
            onClick={handleClose}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || uploadPct !== null}
            onClick={handleSubmit}
            className="rounded-full bg-brand-ink text-white hover:bg-brand-ink/90"
          >
            {isPending ? 'Saving…' : 'Save →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
