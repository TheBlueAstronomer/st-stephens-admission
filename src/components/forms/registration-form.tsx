'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PublicFormLayout } from '@/components/forms/public-form-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import {
  registrationFormSchema,
  REGISTRATION_FORM_STEP_SCHEMAS,
  REGISTRATION_FORM_STEP_LABELS,
  type RegistrationFormData,
} from '@/lib/validations/registration-form';
import { submitRegistration } from '@/app/(public)/forms/registration/actions';

const COUNTRIES = [
  'United Kingdom', 'Ireland', 'United States', 'Canada', 'Australia',
  'New Zealand', 'South Africa', 'Nigeria', 'Ghana', 'Kenya', 'India', 'Other',
];

const ACCOMMODATION_TYPES = [
  { value: 'RESIDENTIAL', label: 'Residential (on-site)' },
  { value: 'NON_RESIDENTIAL', label: 'Non-residential (commuter)' },
  { value: 'UNDECIDED', label: 'Not yet decided' },
];

const ACCOMMODATION_DURATIONS = [
  { value: 'TERM_TIME', label: 'Term-time only' },
  { value: 'FULL_YEAR', label: 'Full academic year' },
  { value: 'NOT_APPLICABLE', label: 'Not applicable' },
];

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema as any),
    defaultValues: {
      applicantId: '',
      legalName: '',
      email: '',
      dateOfBirth: '',
      phone: '',
      addressLineOne: '',
      addressLineTwo: '',
      city: '',
      postcode: '',
      country: '',
      accommodationType: '',
      accommodationDuration: '',
      dietaryRequirements: '',
      mobilityRequirements: '',
      additionalNeeds: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      emergencyEmail: '',
      registrationDeclarationAgreed: false,
      registrationDataConsentAgreed: false,
    },
    mode: 'onTouched',
  });

  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const totalSteps = REGISTRATION_FORM_STEP_LABELS.length;

  const handleNext = useCallback(async () => {
    const stepSchema = REGISTRATION_FORM_STEP_SCHEMAS[currentStep];
    const stepFields = Object.keys(stepSchema.shape) as (keyof RegistrationFormData)[];
    const isValid = await trigger(stepFields);
    if (isValid) {
      setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, totalSteps, trigger]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const onSubmit = useCallback(async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }

      const result = await submitRegistration(formData);

      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else if (result.error) {
        setSubmitError(result.error);
      }
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const stepTitle = REGISTRATION_FORM_STEP_LABELS[currentStep];

  return (
    <PublicFormLayout
      eyebrow="Registration"
      title={stepTitle}
      currentStep={currentStep + 1}
      totalSteps={totalSteps}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Step 1: Confirm Identity */}
        {currentStep === 0 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="applicantId">
                Applicant ID <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="applicantId"
                placeholder="SSH-2025-XXXX"
                aria-invalid={!!errors.applicantId}
                aria-describedby={errors.applicantId ? 'appId-error' : undefined}
                {...register('applicantId')}
              />
              {errors.applicantId && (
                <FieldError id="appId-error">{errors.applicantId.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="legalName">
                Legal Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="legalName"
                aria-invalid={!!errors.legalName}
                aria-describedby={errors.legalName ? 'regName-error' : undefined}
                {...register('legalName')}
              />
              {errors.legalName && (
                <FieldError id="regName-error">{errors.legalName.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="email">
                Email <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="email"
                type="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'regEmail-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <FieldError id="regEmail-error">{errors.email.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="dateOfBirth">
                Date of Birth <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="dateOfBirth"
                type="date"
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'regDob-error' : undefined}
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <FieldError id="regDob-error">{errors.dateOfBirth.message}</FieldError>
              )}
            </Field>
          </FieldGroup>
        )}

        {/* Step 2: Contact & Address */}
        {currentStep === 1 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="phone"
                type="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'regPhone-error' : undefined}
                {...register('phone')}
              />
              {errors.phone && (
                <FieldError id="regPhone-error">{errors.phone.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="addressLineOne">
                Address Line 1 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="addressLineOne"
                aria-invalid={!!errors.addressLineOne}
                aria-describedby={errors.addressLineOne ? 'regAddr1-error' : undefined}
                {...register('addressLineOne')}
              />
              {errors.addressLineOne && (
                <FieldError id="regAddr1-error">{errors.addressLineOne.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="addressLineTwo">Address Line 2</FieldLabel>
              <Input id="addressLineTwo" {...register('addressLineTwo')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="city">
                City <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="city"
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? 'regCity-error' : undefined}
                {...register('city')}
              />
              {errors.city && <FieldError id="regCity-error">{errors.city.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="postcode">
                Postcode <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="postcode"
                aria-invalid={!!errors.postcode}
                aria-describedby={errors.postcode ? 'regPostcode-error' : undefined}
                {...register('postcode')}
              />
              {errors.postcode && (
                <FieldError id="regPostcode-error">{errors.postcode.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="country">
                Country <span className="text-destructive">*</span>
              </FieldLabel>
              <NativeSelect
                id="country"
                className="w-full"
                aria-invalid={!!errors.country}
                aria-describedby={errors.country ? 'regCountry-error' : undefined}
                {...register('country')}
              >
                <NativeSelectOption value="">Select a country</NativeSelectOption>
                {COUNTRIES.map((c) => (
                  <NativeSelectOption key={c} value={c}>
                    {c}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {errors.country && (
                <FieldError id="regCountry-error">{errors.country.message}</FieldError>
              )}
            </Field>
          </FieldGroup>
        )}

        {/* Step 3: Accommodation */}
        {currentStep === 2 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="accommodationType">
                Accommodation Preference <span className="text-destructive">*</span>
              </FieldLabel>
              <NativeSelect
                id="accommodationType"
                className="w-full"
                aria-invalid={!!errors.accommodationType}
                aria-describedby={errors.accommodationType ? 'accomType-error' : undefined}
                {...register('accommodationType')}
              >
                <NativeSelectOption value="">Select preference</NativeSelectOption>
                {ACCOMMODATION_TYPES.map((t) => (
                  <NativeSelectOption key={t.value} value={t.value}>
                    {t.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {errors.accommodationType && (
                <FieldError id="accomType-error">{errors.accommodationType.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="accommodationDuration">
                Duration <span className="text-destructive">*</span>
              </FieldLabel>
              <NativeSelect
                id="accommodationDuration"
                className="w-full"
                aria-invalid={!!errors.accommodationDuration}
                aria-describedby={errors.accommodationDuration ? 'accomDur-error' : undefined}
                {...register('accommodationDuration')}
              >
                <NativeSelectOption value="">Select duration</NativeSelectOption>
                {ACCOMMODATION_DURATIONS.map((d) => (
                  <NativeSelectOption key={d.value} value={d.value}>
                    {d.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {errors.accommodationDuration && (
                <FieldError id="accomDur-error">{errors.accommodationDuration.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="dietaryRequirements">Dietary Requirements</FieldLabel>
              <Textarea id="dietaryRequirements" rows={3} {...register('dietaryRequirements')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="mobilityRequirements">Mobility / Accessibility Requirements</FieldLabel>
              <Textarea id="mobilityRequirements" rows={3} {...register('mobilityRequirements')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="additionalNeeds">Additional Needs</FieldLabel>
              <Textarea id="additionalNeeds" rows={3} {...register('additionalNeeds')} />
            </Field>
          </FieldGroup>
        )}

        {/* Step 4: Emergency Contact */}
        {currentStep === 3 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="emergencyName">
                Emergency Contact Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="emergencyName"
                aria-invalid={!!errors.emergencyName}
                aria-describedby={errors.emergencyName ? 'emName-error' : undefined}
                {...register('emergencyName')}
              />
              {errors.emergencyName && (
                <FieldError id="emName-error">{errors.emergencyName.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="emergencyRelation">
                Relationship <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="emergencyRelation"
                placeholder="e.g. Spouse, Parent, Sibling"
                aria-invalid={!!errors.emergencyRelation}
                aria-describedby={errors.emergencyRelation ? 'emRel-error' : undefined}
                {...register('emergencyRelation')}
              />
              {errors.emergencyRelation && (
                <FieldError id="emRel-error">{errors.emergencyRelation.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="emergencyPhone">
                Emergency Phone <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="emergencyPhone"
                type="tel"
                aria-invalid={!!errors.emergencyPhone}
                aria-describedby={errors.emergencyPhone ? 'emPhone-error' : undefined}
                {...register('emergencyPhone')}
              />
              {errors.emergencyPhone && (
                <FieldError id="emPhone-error">{errors.emergencyPhone.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="emergencyEmail">Emergency Email</FieldLabel>
              <Input
                id="emergencyEmail"
                type="email"
                aria-invalid={!!errors.emergencyEmail}
                aria-describedby={errors.emergencyEmail ? 'emEmail-error' : undefined}
                {...register('emergencyEmail')}
              />
              {errors.emergencyEmail && (
                <FieldError id="emEmail-error">{errors.emergencyEmail.message}</FieldError>
              )}
            </Field>
          </FieldGroup>
        )}

        {/* Step 5: Consent & Declaration */}
        {currentStep === 4 && (
          <FieldGroup>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-input bg-muted/20 p-4 text-sm text-foreground leading-relaxed">
              <p className="mb-3">
                I confirm that the information provided in this registration form is true and
                complete to the best of my knowledge.
              </p>
              <p className="mb-3">
                I understand that St Stephen&apos;s House will process my personal data in accordance
                with data protection legislation and the college&apos;s privacy policy.
              </p>
              <p>
                I agree to abide by the rules and regulations of St Stephen&apos;s House and the
                University of Oxford during my period of study.
              </p>
            </div>

            <Field>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="registrationDeclarationAgreed"
                  checked={watch('registrationDeclarationAgreed')}
                  onCheckedChange={(checked) =>
                    setValue('registrationDeclarationAgreed', checked, { shouldValidate: true })
                  }
                  aria-invalid={!!errors.registrationDeclarationAgreed}
                  aria-describedby={
                    errors.registrationDeclarationAgreed ? 'regDecl-error' : undefined
                  }
                />
                <label
                  htmlFor="registrationDeclarationAgreed"
                  className="text-sm leading-snug cursor-pointer"
                >
                  I confirm I have read and agree to the above declaration.{' '}
                  <span className="text-destructive">*</span>
                </label>
              </div>
              {errors.registrationDeclarationAgreed && (
                <FieldError id="regDecl-error">
                  {errors.registrationDeclarationAgreed.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="registrationDataConsentAgreed"
                  checked={watch('registrationDataConsentAgreed')}
                  onCheckedChange={(checked) =>
                    setValue('registrationDataConsentAgreed', checked, { shouldValidate: true })
                  }
                  aria-invalid={!!errors.registrationDataConsentAgreed}
                  aria-describedby={
                    errors.registrationDataConsentAgreed ? 'regConsent-error' : undefined
                  }
                />
                <label
                  htmlFor="registrationDataConsentAgreed"
                  className="text-sm leading-snug cursor-pointer"
                >
                  I consent to St Stephen&apos;s House processing my personal data.{' '}
                  <span className="text-destructive">*</span>
                </label>
              </div>
              {errors.registrationDataConsentAgreed && (
                <FieldError id="regConsent-error">
                  {errors.registrationDataConsentAgreed.message}
                </FieldError>
              )}
            </Field>
          </FieldGroup>
        )}

        {/* Submit Error */}
        {submitError && (
          <Alert className="mt-6 border-destructive/50 bg-destructive/5 text-destructive">
            <p className="text-sm">{submitError}</p>
          </Alert>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          {currentStep > 0 ? (
            <Button type="button" variant="ghost" onClick={handleBack}>
              &larr; Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next: {REGISTRATION_FORM_STEP_LABELS[currentStep + 1]} &rarr;
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </Button>
          )}
        </div>
      </form>
    </PublicFormLayout>
  );
}
