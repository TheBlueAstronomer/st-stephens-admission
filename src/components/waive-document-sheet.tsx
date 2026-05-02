'use client';

import { useState, useTransition } from 'react';
import { WarningIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { waiveDocument } from '@/app/(staff)/applicants/[id]/document-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface WaiveDocumentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantId: string;
  documentTypeId: string;
  documentName: string;
  isRequired?: boolean;
}

export function WaiveDocumentSheet({
  open,
  onOpenChange,
  applicantId,
  documentTypeId,
  documentName,
  isRequired = false,
}: WaiveDocumentSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [waiverNote, setWaiverNote] = useState('');
  const [touched,    setTouched]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const noteEmpty = !waiverNote.trim();
  const showValidation = touched && noteEmpty;

  function handleClose() {
    setWaiverNote('');
    setTouched(false);
    setError(null);
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (noteEmpty) return;
    setError(null);

    startTransition(async () => {
      const result = await waiveDocument({ applicantId, documentTypeId, waiverNote });
      if (result.success) {
        toast.success(`"${documentName}" requirement waived — reason recorded.`);
        handleClose();
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to waive document.');
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] flex flex-col">
        <SheetHeader className="pb-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Documents
          </p>
          <SheetTitle>Waive Requirement</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 flex-1 overflow-y-auto px-4 py-4"
        >
          {/* Document name display */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">Document</span>
            <span className="text-sm font-semibold text-brand-ink">{documentName}</span>
          </div>

          {/* Warning for required docs */}
          {isRequired && (
            <Alert className="border-amber-200 bg-amber-50">
              <WarningIcon size={15} className="text-amber-600" />
              <AlertTitle className="text-amber-800 text-xs font-semibold">Warning</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs">
                This document is marked as required. A staff note is mandatory.
              </AlertDescription>
            </Alert>
          )}

          {/* Waiver reason */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="waiverNote" className="text-xs font-medium">
              Waiver Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="waiverNote"
              placeholder="e.g. Applicant demonstrated equivalent qualification at interview…"
              value={waiverNote}
              onChange={(e) => { setWaiverNote(e.target.value); setTouched(false); }}
              onBlur={() => setTouched(true)}
              rows={5}
              className={showValidation ? 'border-destructive' : ''}
              aria-invalid={showValidation}
            />
            {showValidation && (
              <p className="text-xs text-destructive">Waiver note is required.</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        <SheetFooter className="border-t border-black/6 pt-3">
          <SheetClose render={<Button variant="outline" type="button" className="rounded-full" />}>
            Cancel
          </SheetClose>
          <Button
            type="submit"
            variant="destructive"
            disabled={isPending || noteEmpty}
            onClick={handleSubmit}
            className="rounded-full"
          >
            {isPending ? 'Waiving…' : 'Waive →'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
