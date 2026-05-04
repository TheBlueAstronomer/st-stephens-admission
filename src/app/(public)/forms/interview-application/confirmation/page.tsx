import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: "Application Received \u2014 St Stephen\u2019s House",
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; name?: string }>;
}) {
  const { ref, name } = await searchParams;

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-160 items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-ink text-white text-sm font-bold">
            SSH
          </div>
          <span className="text-base font-semibold text-brand-ink tracking-tight">
            St Stephen&apos;s House, Oxford
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-160 px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircleIcon size={36} weight="fill" className="text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-brand-ink tracking-tight mb-3">
          Application Received
        </h1>

        <p className="text-base text-muted-foreground mb-2">
          Thank you{name ? `, ${name}` : ''}! Your interview application has been successfully
          submitted.
        </p>

        {ref && ref !== 'PENDING' && (
          <p className="text-sm text-muted-foreground mb-6">
            Your reference number is: <strong className="text-foreground">{ref}</strong>
          </p>
        )}

        <div className="mt-8 rounded-lg border border-gray-100 bg-gray-50 p-6 text-left">
          <h2 className="text-base font-semibold text-foreground mb-3">What happens next?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-medium text-foreground">1.</span>
              The admissions team will review your application.
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">2.</span>
              You will be contacted to arrange an interview date.
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">3.</span>
              Your Director of Ordinands may be contacted for a reference.
            </li>
          </ul>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          If you have any questions, please email{' '}
          <a href="mailto:admissions@ssho.ox.ac.uk" className="text-primary underline">
            admissions@ssho.ox.ac.uk
          </a>
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-160 px-4 py-6">
          <p className="text-xs text-muted-foreground text-center">
            &copy; St Stephen&apos;s House, Oxford
          </p>
        </div>
      </footer>
    </div>
  );
}
