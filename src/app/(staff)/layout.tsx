import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/features/app-shell/components/app-sidebar';
import { AppTopbar } from '@/features/app-shell/components/app-topbar';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-[100dvh] w-full bg-surface-subtle">
          <AppSidebar user={session.user} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AppTopbar user={session.user} />
            <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
