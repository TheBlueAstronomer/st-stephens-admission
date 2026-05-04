import Link from 'next/link';
import { NotePencilIcon, StudentIcon } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: "Forms \u2014 St Stephen\u2019s House",
  description: "Public forms for St Stephen\u2019s House admissions.",
};

export default function FormsIndexPage() {
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
      <main className="mx-auto max-w-160 px-4 py-12">
        <h1 className="text-2xl font-bold text-brand-ink tracking-tight mb-2">
          Admissions Forms
        </h1>
        <p className="text-base text-muted-foreground mb-8">
          Select a form to begin your application or registration.
        </p>

        <div className="grid gap-4">
          <Link
            href="/forms/interview-application"
            className="group flex gap-4 rounded-xl border border-gray-100 p-5 transition-all hover:border-primary/30 hover:bg-primary/2 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10">
              <NotePencilIcon size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground mb-0.5">
                Interview Application
              </h2>
              <p className="text-sm text-muted-foreground">
                Apply for an admissions interview. Includes personal details, BAP status, academic
                history, and references.
              </p>
            </div>
          </Link>

          <Link
            href="/forms/registration"
            className="group flex gap-4 rounded-xl border border-gray-100 p-5 transition-all hover:border-primary/30 hover:bg-primary/2 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10">
              <StudentIcon size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground mb-0.5">Registration Form</h2>
              <p className="text-sm text-muted-foreground">
                Complete your registration after receiving an offer. Includes accommodation
                preferences and emergency contact details.
              </p>
            </div>
          </Link>
        </div>
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
