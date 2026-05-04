'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfoIcon } from '@phosphor-icons/react';
import { PublicFormLayout } from '@/components/forms/public-form-layout';
import { FileUploadField } from '@/components/forms/file-upload-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import {
  interviewApplicationFormSchema,
  INTERVIEW_FORM_STEP_SCHEMAS,
  INTERVIEW_FORM_STEP_LABELS,
  type InterviewApplicationFormData,
} from '@/lib/validations/interview-application-form';
import { submitInterviewApplication } from '@/app/(public)/forms/interview-application/actions';

interface Props {
  dioceses: { id: string; name: string }[];
  programmes: { id: string; courseTitle: string }[];
}

const COUNTRIES = [
  'United Kingdom', 'Ireland', 'United States', 'Canada', 'Australia',
  'New Zealand', 'South Africa', 'Nigeria', 'Ghana', 'Kenya', 'India', 'Other',
];

const BAP_STATUSES = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'INCOMPLETE', label: 'Incomplete' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
];

const DEGREE_CLASSIFICATIONS = [
  { value: 'FIRST', label: 'First Class' },
  { value: 'UPPER_SECOND', label: 'Upper Second (2:1)' },
  { value: 'LOWER_SECOND', label: 'Lower Second (2:2)' },
  { value: 'THIRD', label: 'Third Class' },
  { value: 'PASS', label: 'Pass' },
  { value: 'OTHER', label: 'Other' },
];

export function InterviewApplicationForm({ dioceses, programmes }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({
    gcseTranscript: [],
    aLevelTranscript: [],
    undergradTranscript: [],
  });

  const form = useForm<InterviewApplicationFormData>({
    resolver: zodResolver(interviewApplicationFormSchema as any),
    defaultValues: {
      applicantId: '',
      legalName: '',
      preferredName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      addressLineOne: '',
      addressLineTwo: '',
      city: '',
      postcode: '',
      country: '',
      diocese: '',
      directorOfOrdinands: '',
      ddoEmail: '',
      bapStageOneStatus: '',
      bapStageOneDate: '',
      programmeInterest: '',
      undergraduateDegree: '',
      university: '',
      degreeClassification: '',
      postgraduateDegree: '',
      postgraduateUniversity: '',
      ref1Name: '',
      ref1Email: '',
      ref1Institution: '',
      ref2Name: '',
      ref2Email: '',
      ref2Institution: '',
      personalStatement: '',
      declarationAgreed: false,
      dataConsentAgreed: false,
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

  const totalSteps = INTERVIEW_FORM_STEP_LABELS.length;

  const handleNext = useCallback(async () => {
    const stepSchema = INTERVIEW_FORM_STEP_SCHEMAS[currentStep];
    const stepFields = Object.keys(stepSchema.shape) as (keyof InterviewApplicationFormData)[];
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

  const onSubmit = useCallback(
    async (data: InterviewApplicationFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const formData = new FormData();
        // Append all form fields
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'boolean') {
            formData.append(key, value ? 'true' : 'false');
          } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }

        // Append files
        for (const [fieldName, files] of Object.entries(uploadedFiles)) {
          for (const file of files) {
            formData.append(fieldName, file);
          }
        }

        const result = await submitInterviewApplication(formData);

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
    },
    [uploadedFiles],
  );

  const personalStatement = watch('personalStatement') ?? '';
  const wordCount = personalStatement.split(/\s+/).filter(Boolean).length;

  const stepTitle = INTERVIEW_FORM_STEP_LABELS[currentStep];

  return (
    <PublicFormLayout
      eyebrow="Interview Application"
      title={stepTitle}
      currentStep={currentStep + 1}
      totalSteps={totalSteps}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Step 1: Personal Details */}
        {currentStep === 0 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="applicantId">Applicant ID (if known)</FieldLabel>
              <Input id="applicantId" placeholder="SSH-2025-XXXX" {...register('applicantId')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="legalName">
                Legal Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="legalName"
                aria-invalid={!!errors.legalName}
                aria-describedby={errors.legalName ? 'legalName-error' : undefined}
                {...register('legalName')}
              />
              {errors.legalName && (
                <FieldError id="legalName-error">{errors.legalName.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="preferredName">Preferred Name</FieldLabel>
              <Input id="preferredName" {...register('preferredName')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="dateOfBirth">
                Date of Birth <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="dateOfBirth"
                type="date"
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'dob-error' : undefined}
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <FieldError id="dob-error">{errors.dateOfBirth.message}</FieldError>
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
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <FieldError id="email-error">{errors.email.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="phone"
                type="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                {...register('phone')}
              />
              {errors.phone && (
                <FieldError id="phone-error">{errors.phone.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="addressLineOne">
                Address Line 1 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="addressLineOne"
                aria-invalid={!!errors.addressLineOne}
                aria-describedby={errors.addressLineOne ? 'addr1-error' : undefined}
                {...register('addressLineOne')}
              />
              {errors.addressLineOne && (
                <FieldError id="addr1-error">{errors.addressLineOne.message}</FieldError>
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
                aria-describedby={errors.city ? 'city-error' : undefined}
                {...register('city')}
              />
              {errors.city && <FieldError id="city-error">{errors.city.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="postcode">
                Postcode <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="postcode"
                aria-invalid={!!errors.postcode}
                aria-describedby={errors.postcode ? 'postcode-error' : undefined}
                {...register('postcode')}
              />
              {errors.postcode && (
                <FieldError id="postcode-error">{errors.postcode.message}</FieldError>
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
                aria-describedby={errors.country ? 'country-error' : undefined}
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
                <FieldError id="country-error">{errors.country.message}</FieldError>
              )}
            </Field>
          </FieldGroup>
        )}

        {/* Step 2: BAP Status */}
        {currentStep === 1 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="diocese">
                Diocese <span className="text-destructive">*</span>
              </FieldLabel>
              <NativeSelect
                id="diocese"
                className="w-full"
                aria-invalid={!!errors.diocese}
                aria-describedby={errors.diocese ? 'diocese-error' : undefined}
                {...register('diocese')}
              >
                <NativeSelectOption value="">Select diocese</NativeSelectOption>
                {dioceses.map((d) => (
                  <NativeSelectOption key={d.id} value={d.name}>
                    {d.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {errors.diocese && (
                <FieldError id="diocese-error">{errors.diocese.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="directorOfOrdinands">
                Director of Ordinands <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="directorOfOrdinands"
                aria-invalid={!!errors.directorOfOrdinands}
                aria-describedby={errors.directorOfOrdinands ? 'ddo-error' : undefined}
                {...register('directorOfOrdinands')}
              />
              {errors.directorOfOrdinands && (
                <FieldError id="ddo-error">{errors.directorOfOrdinands.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="ddoEmail">
                DDO Email <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="ddoEmail"
                type="email"
                aria-invalid={!!errors.ddoEmail}
                aria-describedby={errors.ddoEmail ? 'ddoEmail-error' : undefined}
                {...register('ddoEmail')}
              />
              {errors.ddoEmail && (
                <FieldError id="ddoEmail-error">{errors.ddoEmail.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="bapStageOneStatus">
                Stage 1 BAP Status <span className="text-destructive">*</span>
              </FieldLabel>
              <NativeSelect
                id="bapStageOneStatus"
                className="w-full"
                aria-invalid={!!errors.bapStageOneStatus}
                aria-describedby={errors.bapStageOneStatus ? 'bap-error' : undefined}
                {...register('bapStageOneStatus')}
              >
                <NativeSelectOption value="">Select status</NativeSelectOption>
                {BAP_STATUSES.map((s) => (
                  <NativeSelectOption key={s.value} value={s.value}>
                    {s.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {errors.bapStageOneStatus && (
                <FieldError id="bap-error">{errors.bapStageOneStatus.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="bapStageOneDate">Stage 1 BAP Date</FieldLabel>
              <Input id="bapStageOneDate" type="date" {...register('bapStageOneDate')} />
            </Field>

            <Alert className="border-blue-200 bg-blue-50 text-blue-900">
              <div className="flex gap-2 items-start">
                <InfoIcon size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm">
                  Stage 1 BAP must be Completed or Scheduled to proceed to interview.
                </p>
              </div>
            </Alert>
          </FieldGroup>
        )}

        {/* Step 3: Academic History */}
        {currentStep === 2 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="programmeInterest">
                Programme Interest <span className="text-destructive">*</span>
              </FieldLabel>
              <NativeSelect
                id="programmeInterest"
                className="w-full"
                aria-invalid={!!errors.programmeInterest}
                aria-describedby={errors.programmeInterest ? 'prog-error' : undefined}
                {...register('programmeInterest')}
              >
                <NativeSelectOption value="">Select programme</NativeSelectOption>
                {programmes.map((p) => (
                  <NativeSelectOption key={p.id} value={p.courseTitle}>
                    {p.courseTitle}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {errors.programmeInterest && (
                <FieldError id="prog-error">{errors.programmeInterest.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="undergraduateDegree">Undergraduate Degree</FieldLabel>
              <Input id="undergraduateDegree" {...register('undergraduateDegree')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="university">University</FieldLabel>
              <Input id="university" {...register('university')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="degreeClassification">Degree Classification</FieldLabel>
              <NativeSelect
                id="degreeClassification"
                className="w-full"
                {...register('degreeClassification')}
              >
                <NativeSelectOption value="">Select classification</NativeSelectOption>
                {DEGREE_CLASSIFICATIONS.map((d) => (
                  <NativeSelectOption key={d.value} value={d.value}>
                    {d.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="postgraduateDegree">Postgraduate Degree</FieldLabel>
              <Input id="postgraduateDegree" {...register('postgraduateDegree')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="postgraduateUniversity">Postgraduate University</FieldLabel>
              <Input id="postgraduateUniversity" {...register('postgraduateUniversity')} />
            </Field>
          </FieldGroup>
        )}

        {/* Step 4: References */}
        {currentStep === 3 && (
          <FieldGroup>
            <h3 className="text-base font-semibold text-foreground">Academic Reference 1</h3>

            <Field>
              <FieldLabel htmlFor="ref1Name">
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="ref1Name"
                aria-invalid={!!errors.ref1Name}
                aria-describedby={errors.ref1Name ? 'ref1Name-error' : undefined}
                {...register('ref1Name')}
              />
              {errors.ref1Name && (
                <FieldError id="ref1Name-error">{errors.ref1Name.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="ref1Email">
                Email <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="ref1Email"
                type="email"
                aria-invalid={!!errors.ref1Email}
                aria-describedby={errors.ref1Email ? 'ref1Email-error' : undefined}
                {...register('ref1Email')}
              />
              {errors.ref1Email && (
                <FieldError id="ref1Email-error">{errors.ref1Email.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="ref1Institution">
                Institution <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="ref1Institution"
                aria-invalid={!!errors.ref1Institution}
                aria-describedby={errors.ref1Institution ? 'ref1Inst-error' : undefined}
                {...register('ref1Institution')}
              />
              {errors.ref1Institution && (
                <FieldError id="ref1Inst-error">{errors.ref1Institution.message}</FieldError>
              )}
            </Field>

            <div className="my-2 border-t border-gray-100" />

            <h3 className="text-base font-semibold text-foreground">Academic Reference 2</h3>

            <Field>
              <FieldLabel htmlFor="ref2Name">
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="ref2Name"
                aria-invalid={!!errors.ref2Name}
                aria-describedby={errors.ref2Name ? 'ref2Name-error' : undefined}
                {...register('ref2Name')}
              />
              {errors.ref2Name && (
                <FieldError id="ref2Name-error">{errors.ref2Name.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="ref2Email">
                Email <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="ref2Email"
                type="email"
                aria-invalid={!!errors.ref2Email}
                aria-describedby={errors.ref2Email ? 'ref2Email-error' : undefined}
                {...register('ref2Email')}
              />
              {errors.ref2Email && (
                <FieldError id="ref2Email-error">{errors.ref2Email.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="ref2Institution">
                Institution <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="ref2Institution"
                aria-invalid={!!errors.ref2Institution}
                aria-describedby={errors.ref2Institution ? 'ref2Inst-error' : undefined}
                {...register('ref2Institution')}
              />
              {errors.ref2Institution && (
                <FieldError id="ref2Inst-error">{errors.ref2Institution.message}</FieldError>
              )}
            </Field>
          </FieldGroup>
        )}

        {/* Step 5: Supporting Information & Uploads */}
        {currentStep === 4 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="personalStatement">
                Personal Statement <span className="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="personalStatement"
                rows={10}
                aria-invalid={!!errors.personalStatement}
                aria-describedby={errors.personalStatement ? 'ps-error' : undefined}
                {...register('personalStatement')}
              />
              <p className="text-sm text-muted-foreground">
                Word count: {wordCount} / 200 minimum
              </p>
              {errors.personalStatement && (
                <FieldError id="ps-error">{errors.personalStatement.message}</FieldError>
              )}
            </Field>

            <div className="my-2 border-t border-gray-100" />
            <h3 className="text-base font-semibold text-foreground">Document Uploads</h3>

            <FileUploadField
              label="GCSE Transcript"
              accept=".pdf,.jpg,.jpeg,.png"
              files={uploadedFiles.gcseTranscript}
              onFilesChange={(files) =>
                setUploadedFiles((prev) => ({ ...prev, gcseTranscript: files }))
              }
            />

            <FileUploadField
              label="A-Level Transcript"
              accept=".pdf,.jpg,.jpeg,.png"
              files={uploadedFiles.aLevelTranscript}
              onFilesChange={(files) =>
                setUploadedFiles((prev) => ({ ...prev, aLevelTranscript: files }))
              }
            />

            <FileUploadField
              label="Undergraduate Transcript"
              accept=".pdf,.jpg,.jpeg,.png"
              files={uploadedFiles.undergradTranscript}
              onFilesChange={(files) =>
                setUploadedFiles((prev) => ({ ...prev, undergradTranscript: files }))
              }
            />
          </FieldGroup>
        )}

        {/* Step 6: Consent & Declaration */}
        {currentStep === 5 && (
          <FieldGroup>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-input bg-muted/20 p-4 text-sm text-foreground leading-relaxed">
              <p className="mb-3">
                I confirm that the information provided in this application is true and complete to
                the best of my knowledge. I understand that any false or misleading information may
                result in the withdrawal of any offer made or termination of registration.
              </p>
              <p className="mb-3">
                I understand that St Stephen&apos;s House will process my personal data in
                accordance with data protection legislation and the college&apos;s privacy policy
                for the purposes of administering the admissions process.
              </p>
              <p>
                I agree that the information provided may be shared with the Diocese of my
                sponsoring bishop and Director of Ordinands where relevant to my application.
              </p>
            </div>

            <Field>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="declarationAgreed"
                  checked={watch('declarationAgreed')}
                  onCheckedChange={(checked) => setValue('declarationAgreed', checked, { shouldValidate: true })}
                  aria-invalid={!!errors.declarationAgreed}
                  aria-describedby={errors.declarationAgreed ? 'decl-error' : undefined}
                />
                <label htmlFor="declarationAgreed" className="text-sm leading-snug cursor-pointer">
                  I confirm I have read and agree to the above declaration.{' '}
                  <span className="text-destructive">*</span>
                </label>
              </div>
              {errors.declarationAgreed && (
                <FieldError id="decl-error">{errors.declarationAgreed.message}</FieldError>
              )}
            </Field>

            <Field>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="dataConsentAgreed"
                  checked={watch('dataConsentAgreed')}
                  onCheckedChange={(checked) => setValue('dataConsentAgreed', checked, { shouldValidate: true })}
                  aria-invalid={!!errors.dataConsentAgreed}
                  aria-describedby={errors.dataConsentAgreed ? 'consent-error' : undefined}
                />
                <label htmlFor="dataConsentAgreed" className="text-sm leading-snug cursor-pointer">
                  I consent to St Stephen&apos;s House processing my personal data for admissions
                  purposes. <span className="text-destructive">*</span>
                </label>
              </div>
              {errors.dataConsentAgreed && (
                <FieldError id="consent-error">{errors.dataConsentAgreed.message}</FieldError>
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
              Next: {INTERVIEW_FORM_STEP_LABELS[currentStep + 1]} &rarr;
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </form>
    </PublicFormLayout>
  );
}
