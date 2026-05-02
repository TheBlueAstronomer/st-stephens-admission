'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { createOfferSchema, type CreateOfferInput } from '@/lib/validations/offer';
import { createOffer } from '@/app/(staff)/applicants/[id]/actions';
import { useActionExecutor } from '@/hooks/use-action-executor';

interface ExistingOffer {
  offerType: string;
  decisionDate: Date | null;
  conditions: unknown;
  decisionNotes: string | null;
}

interface RecordOfferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantId: string;
  applicantName: string;
  existingOffer?: ExistingOffer;
}

const OFFER_TYPE_OPTIONS = [
  { value: 'UNCONDITIONAL', label: 'Unconditional Offer', description: 'Full offer with no conditions attached.' },
  { value: 'CONDITIONAL', label: 'Conditional Offer', description: 'Offer subject to specified conditions.' },
  { value: 'DECLINED', label: 'Declined', description: 'Application has been declined.' },
  { value: 'WITHDRAWN', label: 'Withdrawn', description: 'Application has been withdrawn.' },
] as const;

export function RecordOfferSheet({
  open,
  onOpenChange,
  applicantId,
  applicantName,
  existingOffer,
}: RecordOfferSheetProps) {
  const { isPending, executeAction } = useActionExecutor();
  const [serverError, setServerError] = useState<string | null>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateOfferInput>({
    resolver: zodResolver(createOfferSchema as any),
    defaultValues: {
      applicantId,
      offerType: 'UNCONDITIONAL',
      decisionDate: new Date().toISOString().split('T')[0],
      conditions: [],
    },
  });

  const isEditMode = !!existingOffer;

  useEffect(() => {
    if (open && existingOffer) {
      const existingConditions = (existingOffer.conditions as string[]) ?? [];
      const dateStr = existingOffer.decisionDate
        ? new Date(existingOffer.decisionDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      reset({
        applicantId,
        offerType: existingOffer.offerType as CreateOfferInput['offerType'],
        decisionDate: dateStr,
        conditions: existingConditions,
        decisionNotes: existingOffer.decisionNotes ?? '',
      });
      setConditions(existingConditions);
    } else if (open && !existingOffer) {
      reset({
        applicantId,
        offerType: 'UNCONDITIONAL',
        decisionDate: new Date().toISOString().split('T')[0],
        conditions: [],
      });
      setConditions([]);
    }
  }, [open, existingOffer, applicantId, reset]);

  const offerType = watch('offerType');
  const isConditional = offerType === 'CONDITIONAL';

  const handleAddCondition = () => {
    const trimmed = newCondition.trim();
    if (trimmed) {
      const next = [...conditions, trimmed];
      setConditions(next);
      setValue('conditions', next, { shouldValidate: true });
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    const next = conditions.filter((_, i) => i !== index);
    setConditions(next);
    setValue('conditions', next, { shouldValidate: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCondition();
    }
  };

  const onSubmit = (data: CreateOfferInput) => {
    setServerError(null);

    const payload: CreateOfferInput = {
      ...data,
      conditions: isConditional ? conditions : [],
    };

    executeAction({
      action: () => createOffer(payload),
      refresh: true,
      onSuccess: () => {
        reset();
        setConditions([]);
        setNewCondition('');
        onOpenChange(false);
      },
      onError: (message) => {
        setServerError(message || 'Failed to record offer decision.');
      },
    });
  };

  const handleClose = () => {
    reset();
    setConditions([]);
    setNewCondition('');
    setServerError(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto px-7 pb-10">
        <SheetHeader className="px-0 pt-8 pb-5 mb-1 border-b border-border">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Outcome</p>
          <SheetTitle className="text-xl font-semibold text-brand-ink leading-tight">{isEditMode ? 'Edit Offer Decision' : 'Record Offer Decision'}</SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">{applicantName}</p>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 pt-6">
          {serverError && (
            <Alert variant="destructive" className="flex items-start gap-2">
              <WarningCircleIcon size={16} className="shrink-0 mt-0.5" />
              <span className="text-sm">{serverError}</span>
            </Alert>
          )}

          {/* Offer Type */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decision Type</Label>
            <div className="space-y-2">
              {OFFER_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer has-[:checked]:border-brand-ink has-[:checked]:bg-brand-ink/4 transition-colors"
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('offerType')}
                    className="mt-0.5 accent-brand-ink"
                  />
                  <div>
                    <span className="text-sm font-medium text-brand-ink">{opt.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.offerType && (
              <p className="text-xs text-red-600">{errors.offerType.message}</p>
            )}
          </div>

          {/* Decision Date */}
          <div className="space-y-2">
            <Label htmlFor="decisionDate" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decision Date</Label>
            <Input
              id="decisionDate"
              type="date"
              {...register('decisionDate')}
              className="rounded-xl h-10"
            />
            {errors.decisionDate && (
              <p className="text-xs text-red-600">{errors.decisionDate.message}</p>
            )}
          </div>

          {/* Conditions — only shown for CONDITIONAL */}
          {isConditional && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conditions</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Add at least one condition for this offer.
                </p>
              </div>

              {conditions.length > 0 && (
                <ul className="space-y-1.5">
                  {conditions.map((cond, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm"
                    >
                      <span className="flex-1">{cond}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        className="text-muted-foreground hover:text-red-600 transition-colors"
                        aria-label="Remove condition"
                      >
                        <TrashIcon size={14} weight="light" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Subject to Stage 2 BAP assessment"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="rounded-xl flex-1 h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCondition}
                  className="rounded-xl shrink-0 h-10 px-4"
                >
                  <PlusIcon size={14} weight="bold" className="mr-1" />
                  Add
                </Button>
              </div>

              {errors.conditions && (
                <p className="text-xs text-red-600">
                  {Array.isArray(errors.conditions)
                    ? (errors.conditions as any).root?.message ?? 'At least one condition is required.'
                    : (errors.conditions as any).message}
                </p>
              )}
            </div>
          )}

          {/* Decision Notes */}
          <div className="space-y-2">
            <Label htmlFor="decisionNotes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {offerType === 'DECLINED' || offerType === 'WITHDRAWN' ? 'Reason / Notes' : 'Notes'}
              <span className="ml-1.5 normal-case font-normal text-muted-foreground tracking-normal">(optional)</span>
            </Label>
            <Textarea
              id="decisionNotes"
              rows={3}
              placeholder={
                offerType === 'DECLINED'
                  ? 'Reason for declining the application…'
                  : offerType === 'WITHDRAWN'
                    ? 'Reason for withdrawal…'
                    : 'Any additional notes about this decision…'
              }
              {...register('decisionNotes')}
              className="rounded-xl resize-none"
            />
          </div>

          <input type="hidden" {...register('applicantId')} />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="rounded-full bg-brand-ink text-white hover:bg-brand-ink/90">
              {isPending ? 'Saving…' : isEditMode ? 'Update Decision' : 'Record Decision'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
