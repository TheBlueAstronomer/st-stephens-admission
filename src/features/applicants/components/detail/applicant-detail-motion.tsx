'use client';

import { memo, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface MotionShellProps {
  children: ReactNode;
  className?: string;
}

interface TabPanelMotionProps extends MotionShellProps {
  active: boolean;
  motionKey: string;
}

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export function ApplicantProfileMotion({ children, className }: MotionShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : spring}
    >
      {children}
    </motion.div>
  );
}

export function ApplicantTabPanelMotion({ active, children, className, motionKey }: TabPanelMotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={motionKey}
      className={className}
      initial={reduceMotion || active ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      animate={active || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={reduceMotion ? { duration: 0 } : spring}
    >
      {children}
    </motion.div>
  );
}

export const CurrentStagePulse = memo(function CurrentStagePulse() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return null;
  }

  return (
    <motion.span
      aria-hidden="true"
      className="absolute inset-[-5px] rounded-full border border-brand-ink/20 bg-brand-ink/8"
      animate={{ opacity: [0.16, 0.42, 0.16], scale: [1, 1.35, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
});
