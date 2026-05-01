import { LoginCard } from '@/components/login-card';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F8F7F5] px-4 md:flex-row md:px-0">
      {/* Left half — Institutional branding */}
      <div className="flex w-full flex-col items-center justify-center gap-6 py-12 md:w-1/2 md:py-0">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* SSH Crest placeholder */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1A2744] text-white text-2xl font-bold">
            SSH
          </div>
          <div>
            <h1
              className="text-3xl font-bold tracking-tight text-[#1A2744]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              St Stephen&apos;s House, Oxford
            </h1>
            <p className="mt-1 text-lg font-medium text-[#1A2744]/80">
              Admissions Management
            </p>
          </div>
          <p className="max-w-xs text-sm text-[#6B7280]">
            Manage the full ordinand admissions lifecycle.
          </p>
        </div>
      </div>

      {/* Right half — Login card */}
      <div className="flex w-full items-center justify-center pb-12 md:w-1/2 md:pb-0">
        <LoginCard error={params.error} callbackUrl={params.callbackUrl} />
      </div>
    </div>
  );
}
