'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SpinnerGap } from '@phosphor-icons/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  createApplicantSchema,
  type CreateApplicantInput,
} from '@/lib/validations/applicant';
import { createApplicant } from '@/app/(staff)/applicants/actions';

interface ReferenceData {
  programmes: { id: string; courseTitle: string }[];
  dioceses: { id: string; name: string }[];
  admissionsYears: { id: string; label: string; isCurrent: boolean }[];
}

interface CreateApplicantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceData: ReferenceData;
}

export function CreateApplicantSheet({
  open,
  onOpenChange,
  referenceData,
}: CreateApplicantSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApplicantInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createApplicantSchema as any),
    defaultValues: {
      legalName: '',
      email: '',
      programmeId: '',
      admissionsYearId:
        referenceData.admissionsYears.find((y) => y.isCurrent)?.id ?? '',
    },
  });

  const onSubmit = async (data: CreateApplicantInput) => {
    setServerError(null);
    setWarning(null);

    startTransition(async () => {
      const result = await createApplicant(data);

      if (!result.success) {
        setServerError(result.error ?? 'An unknown error occurred.');
        return;
      }

      if (result.warning) {
        setWarning(result.warning);
      }

      reset();
      onOpenChange(false);
      router.push(`/applicants/${result.data?.id}`);
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] overflow-y-auto rounded-l-[1.5rem] bg-[#FAFAF9] px-6 pb-8">
        <SheetHeader className="mb-6 px-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Applicant Management
          </span>
          <SheetTitle className="text-2xl font-semibold text-[#1A2744]">
            Add Applicant
          </SheetTitle>
          <SheetDescription>
            Create a new applicant record at the enquiry stage.
          </SheetDescription>
        </SheetHeader>

        {serverError && (
          <Alert variant="destructive" className="mb-4 rounded-xl border-red-200 bg-red-50 text-red-800">
            <span className="font-medium">Error:</span> {serverError}
          </Alert>
        )}

        {warning && (
          <Alert className="mb-4 rounded-xl border-amber-200 bg-amber-50 text-amber-800">
            <span className="font-medium">Warning:</span> {warning}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal */}
          <div>
            <SectionLabel>Personal</SectionLabel>
            <div className="space-y-3">
              <FormField label="Legal Name *" error={errors.legalName?.message}>
                <Input {...register('legalName')} placeholder="Full legal name" />
              </FormField>
              <FormField label="Preferred Name" error={errors.preferredName?.message}>
                <Input {...register('preferredName')} placeholder="Preferred name" />
              </FormField>
              <FormField label="Date of Birth" error={errors.dateOfBirth?.message}>
                <Input {...register('dateOfBirth')} type="date" />
              </FormField>
              <FormField label="Email *" error={errors.email?.message}>
                <Input {...register('email')} type="email" placeholder="applicant@example.com" />
              </FormField>
              <FormField label="Phone" error={errors.phone?.message}>
                <Input {...register('phone')} placeholder="+44 ..." />
              </FormField>
            </div>
          </div>

          {/* Address */}
          <div>
            <SectionLabel>Address</SectionLabel>
            <div className="space-y-3">
              <FormField label="Address Line 1">
                <Input {...register('addressLineOne')} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="City">
                  <Input {...register('city')} />
                </FormField>
                <FormField label="Postcode">
                  <Input {...register('postcode')} />
                </FormField>
              </div>
              <FormField label="Country">
                <Input {...register('country')} />
              </FormField>
            </div>
          </div>

          {/* Ecclesial */}
          <div>
            <SectionLabel>Ecclesial</SectionLabel>
            <div className="space-y-3">
              <FormField label="Diocese" error={errors.dioceseId?.message}>
                <select
                  {...register('dioceseId')}
                  className="flex h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm focus:border-[#1A2744]/30 focus:outline-none transition-colors"
                >
                  <option value="">Select diocese...</option>
                  {referenceData.dioceses.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="DDO Name">
                <Input {...register('directorOfOrdinandsName')} />
              </FormField>
              <FormField label="DDO Email">
                <Input {...register('directorOfOrdinandsEmail')} type="email" />
              </FormField>
            </div>
          </div>

          {/* BAP */}
          <div>
            <SectionLabel>BAP</SectionLabel>
            <div className="space-y-3">
              <FormField label="Stage 1 Status">
                <select
                  {...register('stageOneStatus')}
                  className="flex h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm focus:border-[#1A2744]/30 focus:outline-none transition-colors"
                >
                  <option value="">Select status...</option>
                  <option value="INCOMPLETE">Incomplete</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NOT_APPLICABLE">Not Applicable</option>
                </select>
              </FormField>
              <FormField label="Stage 1 Date">
                <Input {...register('stageOneDate')} type="date" />
              </FormField>
            </div>
          </div>

          {/* Programme */}
          <div>
            <SectionLabel>Programme</SectionLabel>
            <div className="space-y-3">
              <FormField label="Programme *" error={errors.programmeId?.message}>
                <select
                  {...register('programmeId')}
                  className="flex h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm focus:border-[#1A2744]/30 focus:outline-none transition-colors"
                >
                  <option value="">Select programme...</option>
                  {referenceData.programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.courseTitle}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Admissions Year *" error={errors.admissionsYearId?.message}>
                <select
                  {...register('admissionsYearId')}
                  className="flex h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm focus:border-[#1A2744]/30 focus:outline-none transition-colors"
                >
                  <option value="">Select year...</option>
                  {referenceData.admissionsYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-black/[0.06]">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-muted-foreground hover:text-[#1A2744]"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#1A2744] text-white hover:bg-[#23304d] shadow-sm shadow-[#1A2744]/20 px-6"
            >
              {isPending && (
                <SpinnerGap size={16} className="mr-2 animate-spin" />
              )}
              Create Applicant
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <Separator className="flex-1 bg-black/[0.06]" />
      <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      <Separator className="flex-1 bg-black/[0.06]" />
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#1A2744]/80">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-destructive animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
