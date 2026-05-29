'use client';

import { CheckCircleIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface StepTransitionProps {
  step: number;
  children: React.ReactNode;
}

interface ProgressRailProps {
  currentStep: number;
  steps: readonly string[];
  eyebrow: string;
}

interface SubmitButtonContentProps {
  isSubmitting: boolean;
  idleLabel: string;
  submittingLabel: string;
}

interface ConfirmationSuccessMarkProps {
  label: string;
}

const spring = { type: 'spring' as const, stiffness: 140, damping: 22 };

export function PublicFormStepTransition({ step, children }: StepTransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="overflow-x-clip">
      <motion.div
        key={step}
        initial={reduceMotion || step === 0 ? { opacity: 1, x: 0 } : { opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reduceMotion ? { duration: 0 } : spring}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function PublicFormProgressRail({ currentStep, steps, eyebrow }: ProgressRailProps) {
  const reduceMotion = useReducedMotion();

  return (
    <aside className="hidden md:block">
      <div className="sticky top-8 border-l border-border/35 pl-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Complete each section before submitting your application to the admissions team.
        </p>

        <ol className="mt-8 space-y-4">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isComplete = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <li key={label} className="relative flex items-start gap-3">
                <span className="relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-white text-[0.7rem] font-semibold text-muted-foreground">
                  {isCurrent && (
                    <motion.span
                      layoutId="public-form-current-step"
                      className="absolute inset-0 rounded-full bg-brand-ink"
                      transition={reduceMotion ? { duration: 0 } : spring}
                    />
                  )}
                  <span className={isCurrent ? 'relative text-white' : 'relative'}>
                    {isComplete ? (
                      <CheckCircleIcon size={14} weight="fill" className="text-success" />
                    ) : (
                      stepNumber
                    )}
                  </span>
                </span>
                <div>
                  <p
                    className={
                      isCurrent
                        ? 'text-sm font-semibold text-brand-ink'
                        : 'text-sm font-medium text-muted-foreground'
                    }
                  >
                    {label}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    Step {stepNumber.toString().padStart(2, '0')}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

export function SubmitButtonContent({
  isSubmitting,
  idleLabel,
  submittingLabel,
}: SubmitButtonContentProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isSubmitting ? (
        <motion.span
          key="submitting"
          className="inline-flex items-center gap-2"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
        >
          <span>{submittingLabel}</span>
          <span
            aria-hidden="true"
            className="relative h-1.5 w-8 overflow-hidden rounded-full bg-primary-foreground/25"
          >
            <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-primary-foreground/80 motion-safe:animate-[public-submit-shimmer_1s_cubic-bezier(0.16,1,0.3,1)_infinite]" />
          </span>
        </motion.span>
      ) : (
        <motion.span
          key="idle"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
        >
          {idleLabel}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function ConfirmationSuccessMark({ label }: ConfirmationSuccessMarkProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-success/20 bg-success/10 text-success shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : spring}
      aria-label={label}
      role="img"
    >
      <CheckCircleIcon size={34} weight="fill" aria-hidden="true" />
    </motion.div>
  );
}
