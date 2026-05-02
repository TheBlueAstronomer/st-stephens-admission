'use client';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isPending = false,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden" showCloseButton={false}>
        <div className="p-1">
          <div className="rounded-[1.25rem] border border-black/6 bg-white p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-brand-ink">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="mx-0 mb-0 mt-0 rounded-[0_0_1.25rem_1.25rem] border-t border-black/6 bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
            <DialogClose
              render={<Button variant="outline" className="rounded-full" disabled={isPending} />}
            >
              {cancelLabel}
            </DialogClose>
            <Button
              className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90"
              disabled={isPending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
