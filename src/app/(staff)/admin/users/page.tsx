import { prisma } from '@/lib/db';
import { UserManagementTable } from '@/features/admin/components/user-management-table';
import { InviteUserDialog } from '@/features/admin/components/invite-user-dialog';

export const dynamic = 'force-dynamic';

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const roleFilter = typeof params.role === 'string' ? params.role : undefined;
  const statusFilter = typeof params.status === 'string' ? params.status : undefined;
  const search = typeof params.q === 'string' ? params.q : undefined;

  const where: Record<string, unknown> = {};
  if (roleFilter) where.role = roleFilter;
  if (statusFilter === 'active') where.isActive = true;
  if (statusFilter === 'inactive') where.isActive = false;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1A2744]">Users</h2>
        <InviteUserDialog />
      </div>
      <UserManagementTable users={users} />
    </div>
  );
}
