'use client';

import { signIn } from 'next-auth/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WarningCircle } from '@phosphor-icons/react';

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized:
    'This Microsoft account is not authorised to access the admissions system. Contact your system administrator.',
  inactive:
    'Your account has been deactivated. Contact your system administrator.',
  'no-email':
    'Unable to retrieve your email address from Microsoft. Please try again.',
  default: 'Your session has expired. Please sign in again.',
};

interface LoginCardProps {
  error?: string;
  callbackUrl?: string;
}

export function LoginCard({ error, callbackUrl }: LoginCardProps) {
  const errorMessage = error
    ? ERROR_MESSAGES[error] || ERROR_MESSAGES.default
    : null;

  return (
    <div className="w-full max-w-sm">
      {/* Double-Bezel outer shell */}
      <div className="rounded-[2rem] bg-black/[0.04] p-2 ring-1 ring-black/[0.06]">
        {/* Inner core */}
        <Card className="rounded-[calc(2rem-0.5rem)] border-0 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <CardHeader className="flex flex-col items-center gap-4 pb-2 pt-8">
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-black/5 text-[#6B7280] border-0"
            >
              Staff Portal
            </Badge>
            <h2
              className="text-xl font-semibold text-[#1A2744]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Sign in to Admissions
            </h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 pb-8">
            <button
              onClick={() =>
                signIn('microsoft-entra-id', {
                  callbackUrl: callbackUrl || '/dashboard',
                })
              }
              className="group flex w-full items-center justify-between rounded-full bg-[#1A2744] px-6 py-3 text-white transition-all hover:bg-[#233360] active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                {/* Microsoft logo */}
                <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                <span className="text-sm font-medium">
                  Sign in with Microsoft
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 13L13 1M13 1H5M13 1v8" />
                </svg>
              </div>
            </button>

            {errorMessage && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Alert variant="destructive" className="border-[#C0392B]/20 bg-[#C0392B]/5">
                  <WarningCircle size={16} weight="light" className="text-[#C0392B]" />
                  <AlertDescription className="text-sm text-[#C0392B]">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
