'use client';

import { Progress } from '@/components/ui/progress';
import { PublicFormProgressRail } from '@/features/public-forms/components/public-form-motion';

interface PublicFormLayoutProps {
  eyebrow: string;
  title: string;
  currentStep: number;
  totalSteps: number;
  steps?: readonly string[];
  railSteps?: readonly string[];
  children: React.ReactNode;
}

export function PublicFormLayout({
  eyebrow,
  title,
  currentStep,
  totalSteps,
  steps,
  railSteps,
  children,
}: PublicFormLayoutProps) {
  const progressValue = (currentStep / totalSteps) * 100;

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

      <main className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 px-4 py-8 md:grid-cols-[minmax(0,640px)_minmax(220px,280px)] md:px-6 md:py-10 lg:px-0">
        <section className="w-full max-w-160">
          <p className="mb-1 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-brand-ink md:text-3xl">
            {title}
          </h1>

          <div className="mb-8">
            <Progress
              value={progressValue}
              className="[&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out [&_[data-slot=progress-track]]:h-2"
            />
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {children}
        </section>

        {steps && (
          <PublicFormProgressRail
            currentStep={currentStep}
            steps={railSteps ?? steps}
            eyebrow={eyebrow}
          />
        )}
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
