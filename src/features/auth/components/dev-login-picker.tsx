'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DEV_USERS = [
  {
    name: 'Alice Admissions',
    email: 'alice@ssh-dev.local',
    role: 'ADMISSIONS_STAFF' as const,
    description: 'Full applicant management, offers, documents, scheduling',
    color: 'bg-[#1A2744] text-white',
    icon: '📋',
    landingPage: '/dashboard',
  },
  {
    name: 'Bob Academic',
    email: 'bob@ssh-dev.local',
    role: 'ACADEMIC_STAFF' as const,
    description: 'Read-only applicants, assigned interview outcomes',
    color: 'bg-[#C4A882] text-[#1A2744]',
    icon: '🎓',
    landingPage: '/applicants',
  },
  {
    name: 'Carol Leadership',
    email: 'carol@ssh-dev.local',
    role: 'SENIOR_LEADERSHIP' as const,
    description: 'Dashboard overview and read-only reports',
    color: 'bg-[#6B7280]/20 text-[#6B7280]',
    icon: '👁️',
    landingPage: '/dashboard',
  },
  {
    name: 'Dave Admin',
    email: 'dave@ssh-dev.local',
    role: 'SYSTEM_ADMINISTRATOR' as const,
    description: 'Everything — user management, system config, all routes',
    color: 'bg-slate-600 text-white',
    icon: '⚙️',
    landingPage: '/dashboard',
  },
];

export function DevLoginPicker() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleLogin(email: string, landingPage: string) {
    setLoading(email);
    await signIn('dev-credentials', {
      email,
      callbackUrl: landingPage,
    });
  }

  return (
    <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
      {DEV_USERS.map((user) => (
        <button
          key={user.email}
          onClick={() => handleLogin(user.email, user.landingPage)}
          disabled={loading !== null}
          className="group text-left"
        >
          <Card className="h-full border-0 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{user.icon}</span>
                <Badge className={`border-0 text-[10px] ${user.color}`}>
                  {user.role.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-[#1A2744]">
                  {loading === user.email ? 'Signing in…' : user.name}
                </p>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  {user.description}
                </p>
              </div>
              <p className="text-[10px] font-mono text-[#6B7280]/60">
                {user.email}
              </p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
