'use client';

import { Progress } from '@/components/ui/progress';

interface PublicFormLayoutProps {
  eyebrow: string;
  title: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function PublicFormLayout({
  eyebrow,
  title,
  currentStep,
  totalSteps,
  children,
}: PublicFormLayoutProps) {
  const progressValue = (currentStep / totalSteps) * 100;

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

      {/* Main Content */}
      <main className="mx-auto max-w-160 px-4 py-8">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-1">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-bold text-brand-ink tracking-tight mb-6">
          {title}
        </h1>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progressValue} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Step Content */}
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          {children}
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
