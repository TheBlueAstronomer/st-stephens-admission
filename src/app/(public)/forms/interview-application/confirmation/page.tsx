import { ApplicationReceivedPanel } from '@/features/public-forms/components/application-received-panel';

export const metadata = {
  title: "Application Received \u2014 St Stephen\u2019s House",
};

function formatSubmittedAt(value?: string) {
  if (!value) return null;

  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return null;

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(submittedAt);
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; name?: string; submitted?: string }>;
}) {
  const { ref, name, submitted } = await searchParams;
  const referenceNumber = ref && ref !== 'PENDING' ? ref : undefined;
  const submittedAtLabel = formatSubmittedAt(submitted);

  return (
    <div className="min-h-dvh bg-white text-foreground">
      <header className="border-b border-border/25 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 md:px-6 lg:px-0">
          <div className="flex size-10 items-center justify-center rounded-full bg-brand-ink text-sm font-bold text-white">
            SSH
          </div>
          <span className="text-base font-semibold text-brand-ink tracking-tight">
            St Stephen&apos;s House, Oxford
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-160 px-4 py-16 md:py-20">
        <ApplicationReceivedPanel
          name={name}
          referenceNumber={referenceNumber}
          submittedAtLabel={submittedAtLabel}
        />
      </main>

      <footer className="border-t border-border/25 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-0">
          <p className="text-xs text-muted-foreground text-center">
            &copy; St Stephen&apos;s House, Oxford
          </p>
        </div>
      </footer>
    </div>
  );
}
