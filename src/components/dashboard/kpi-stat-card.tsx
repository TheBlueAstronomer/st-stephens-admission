'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface KpiStatCardProps {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  delay?: number;
}

export function KpiStatCard({ label, value, subtitle, icon, delay = 0 }: KpiStatCardProps) {
  const [displayed, setDisplayed] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;

    const duration = 600;
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
  }, [value, visible]);

  return (
    <div
      className={cn(
        'rounded-[1.5rem] p-1.5 bg-black/4 ring-1 ring-black/6 transition-all duration-500',
        visible
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
            {displayed}
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
