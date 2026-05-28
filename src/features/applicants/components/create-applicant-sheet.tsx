'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Label } from '@/components/ui/label';
import { Field, FieldError, FieldSeparator } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import {
  createApplicantSchema,
  type CreateApplicantInput,
} from '@/features/applicants/validations/applicant';
import { createApplicant } from '@/features/applicants/actions/applicant-actions';

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
  const resolver = zodResolver(createApplicantSchema as never) as Resolver<CreateApplicantInput>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApplicantInput>({
    resolver,
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
      <SheetContent side="right" className="w-120 overflow-y-auto rounded-l-[1.5rem] bg-canvas px-6 pb-8">
        <SheetHeader className="mb-6 px-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Applicant Management
          </span>
          <SheetTitle className="text-2xl font-semibold text-brand-ink">
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
            <FieldSeparator>Personal</FieldSeparator>
            <div className="mt-3 space-y-3">
              <Field>
                <Label className="text-sm text-brand-ink/80">Legal Name *</Label>
                <Input {...register('legalName')} placeholder="Full legal name" />
                {errors.legalName?.message && <FieldError>{errors.legalName.message}</FieldError>}
              </Field>
              <Field>
                <Label className="text-sm text-brand-ink/80">Preferred Name</Label>
                <Input {...register('preferredName')} placeholder="Preferred name" />
                {errors.preferredName?.message && <FieldError>{errors.preferredName.message}</FieldError>}
              </Field>
              <Field>
                <Label className="text-sm text-brand-ink/80">Date of Birth</Label>
                <Input {...register('dateOfBirth')} type="date" />
                {errors.dateOfBirth?.message && <FieldError>{errors.dateOfBirth.message}</FieldError>}
              </Field>
              <Field>
                <Label className="text-sm text-brand-ink/80">Email *</Label>
                <Input {...register('email')} type="email" placeholder="applicant@example.com" />
                {errors.email?.message && <FieldError>{errors.email.message}</FieldError>}
              </Field>
              <Field>
                <Label className="text-sm text-brand-ink/80">Phone</Label>
                <Input {...register('phone')} placeholder="+44 ..." />
                {errors.phone?.message && <FieldError>{errors.phone.message}</FieldError>}
              </Field>
            </div>
          </div>

          {/* Address */}
          <div>
            <FieldSeparator>Address</FieldSeparator>
            <div className="mt-3 space-y-3">
              <Field>
                <Label className="text-sm text-brand-ink/80">Address Line 1</Label>
                <Input {...register('addressLineOne')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <Label className="text-sm text-brand-ink/80">City</Label>
                  <Input {...register('city')} />
                </Field>
                <Field>
                  <Label className="text-sm text-brand-ink/80">Postcode</Label>
                  <Input {...register('postcode')} />
                </Field>
              </div>
              <Field>
                <Label className="text-sm text-brand-ink/80">Country</Label>
                <Input {...register('country')} />
              </Field>
            </div>
          </div>

          {/* Ecclesial */}
          <div>
            <FieldSeparator>Ecclesial</FieldSeparator>
            <div className="mt-3 space-y-3">
              <Field>
                <Label className="text-sm text-brand-ink/80">Diocese</Label>
                <NativeSelect {...register('dioceseId')} className="w-full">
                  <NativeSelectOption value="">Select diocese...</NativeSelectOption>
                  {referenceData.dioceses.map((d) => (
                    <NativeSelectOption key={d.id} value={d.id}>
                      {d.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {errors.dioceseId?.message && <FieldError>{errors.dioceseId.message}</FieldError>}
              </Field>
              <Field>
                <Label className="text-sm text-brand-ink/80">DDO Name</Label>
                <Input {...register('directorOfOrdinandsName')} />
              </Field>
              <Field>
                <Label className="text-sm text-brand-ink/80">DDO Email</Label>
                <Input {...register('directorOfOrdinandsEmail')} type="email" />
              </Field>
            </div>
          </div>

          {/* BAP */}
          <div>
            <FieldSeparator>BAP</FieldSeparator>
            <div className="mt-3 space-y-3">
              <Field>
                <Label className="text-sm text-brand-ink/80">Stage 1 Status</Label>
                <NativeSelect {...register('stageOneStatus')} className="w-full">
                  <NativeSelectOption value="">Select status...</NativeSelectOption>
                  <NativeSelectOption value="INCOMPLETE">Incomplete</NativeSelectOption>
                  <NativeSelectOption value="SCHEDULED">Scheduled</NativeSelectOption>
                  <NativeSelectOption value="COMPLETED">Completed</NativeSelectOption>
                  <NativeSelectOption value="NOT_APPLICABLE">Not Applicable</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <Label className="text-sm text-brand-ink/80">Stage 1 Date</Label>
                <Input {...register('stageOneDate')} type="date" />
              </Field>
            </div>
          </div>

          {/* Programme */}
          <div>
            <FieldSeparator>Programme</FieldSeparator>
            <div className="mt-3 space-y-3">
              <Field>
                <Label className="text-sm text-brand-ink/80">Programme *</Label>
                <NativeSelect {...register('programmeId')} className="w-full">
                  <NativeSelectOption value="">Select programme...</NativeSelectOption>
                  {referenceData.programmes.map((p) => (
                    <NativeSelectOption key={p.id} value={p.id}>
                      {p.courseTitle}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {errors.programmeId?.message && <FieldError>{errors.programmeId.message}</FieldError>}
              </Field>
              <Field>
                <Label className="text-sm text-brand-ink/80">Admissions Year *</Label>
                <NativeSelect {...register('admissionsYearId')} className="w-full">
                  <NativeSelectOption value="">Select year...</NativeSelectOption>
                  {referenceData.admissionsYears.map((y) => (
                    <NativeSelectOption key={y.id} value={y.id}>
                      {y.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {errors.admissionsYearId?.message && <FieldError>{errors.admissionsYearId.message}</FieldError>}
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-black/6">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-muted-foreground hover:text-brand-ink"
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
              className="rounded-full bg-brand-solid px-6 text-brand-solid-foreground shadow-sm shadow-brand-solid/20 hover:bg-brand-solid/90"
            >
              {isPending && (
                <Spinner className="mr-2" />
              )}
              Create Applicant
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

