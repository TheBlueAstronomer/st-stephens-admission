import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'SYSTEM_ADMINISTRATOR') {
    redirect('/forbidden');
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          System
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A2744]">
          Administration
        </h1>
      </div>
      <div className="flex gap-6">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
