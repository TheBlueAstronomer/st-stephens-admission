import { redirect } from 'next/navigation';
import { DevLoginPicker } from '@/components/dev-login-picker';

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F8F7F5] px-4">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Development Mode
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1A2744]">
          Dev Login
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Pick a role to sign in as. No Microsoft account needed.
        </p>
      </div>
      <DevLoginPicker />
    </div>
  );
}
