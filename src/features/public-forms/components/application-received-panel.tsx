'use client';

import { ConfirmationSuccessMark } from '@/features/public-forms/components/public-form-motion';

interface ApplicationReceivedPanelProps {
  name?: string;
  referenceNumber?: string;
  submittedAtLabel?: string | null;
}

export function ApplicationReceivedPanel({
  name,
  referenceNumber,
  submittedAtLabel,
}: ApplicationReceivedPanelProps) {
  return (
    <div className="text-center">
      <ConfirmationSuccessMark label="Application received" />

      <h1 className="mb-3 text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">
        Application Received
      </h1>

      <p className="mx-auto mb-2 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
        Thank you{name ? `, ${name}` : ''}. Your interview application has been received by
        St Stephen&apos;s House.
      </p>

      {(referenceNumber || submittedAtLabel) && (
        <dl className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-2 border-y border-border/30 py-4 text-sm sm:grid-cols-2">
          {referenceNumber && (
            <div>
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-mono font-semibold text-foreground">{referenceNumber}</dd>
            </div>
          )}
          {submittedAtLabel && (
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-mono font-semibold text-foreground">{submittedAtLabel}</dd>
            </div>
          )}
        </dl>
      )}

      <section className="mt-10 border-l border-border/35 pl-5 text-left">
        <h2 className="mb-4 text-base font-semibold text-foreground">What happens next?</h2>
        <ol className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li className="grid grid-cols-[1.5rem_1fr] gap-2">
            <span className="font-mono font-medium text-foreground">01</span>
            <span>The admissions team will review your application.</span>
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] gap-2">
            <span className="font-mono font-medium text-foreground">02</span>
            <span>You will be contacted to arrange an interview date.</span>
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] gap-2">
            <span className="font-mono font-medium text-foreground">03</span>
            <span>Your Director of Ordinands may be contacted for a reference.</span>
          </li>
        </ol>
      </section>

      <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
        If you have any questions, please email{' '}
        <a href="mailto:admissions@ssho.ox.ac.uk" className="text-primary underline underline-offset-4">
          admissions@ssho.ox.ac.uk
        </a>
      </p>
    </div>
  );
}
