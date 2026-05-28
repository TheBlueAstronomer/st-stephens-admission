'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

interface KpiStatCardProps {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  delay?: number;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function KpiStatCard({ label, value, subtitle, icon, delay = 0 }: KpiStatCardProps) {
  const [displayed, setDisplayed] = useState(0);
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const rafRef = useRef<number | null>(null);
  const isVisible = prefersReducedMotion || visible;
  const visibleValue = prefersReducedMotion ? value : displayed;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timeout = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay, prefersReducedMotion]);

  useEffect(() => {
    if (!isVisible || prefersReducedMotion) return;

    const duration = 220;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, isVisible, prefersReducedMotion]);

  return (
    <div
      className={cn(
        'rounded-[1.5rem] bg-black/4 p-1.5 ring-1 ring-black/6 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:translate-y-0 motion-reduce:transition-none',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0',
      )}
    >
      <div className="rounded-[1.125rem] bg-white px-6 py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-[2.5rem] font-bold leading-none text-[#1A2744]">
            {visibleValue}
          </span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        {subtitle && (
          <p className="mt-1.5 text-[13px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
