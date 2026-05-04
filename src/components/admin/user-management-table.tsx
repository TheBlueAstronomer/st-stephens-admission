'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { DotsThreeIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { deactivateUser, reactivateUser, updateUserRole } from '@/app/(staff)/admin/users/actions';
import { toast } from 'sonner';
import type { UserRole } from '@/generated/prisma/client';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMISSIONS_STAFF: 'Admissions Staff',
  ACADEMIC_STAFF: 'Academic Staff',
  SENIOR_LEADERSHIP: 'Senior Leadership',
  SYSTEM_ADMINISTRATOR: 'System Administrator',
};

const ROLES: UserRole[] = [
  'ADMISSIONS_STAFF',
  'ACADEMIC_STAFF',
  'SENIOR_LEADERSHIP',
  'SYSTEM_ADMINISTRATOR',
];

export function UserManagementTable({ users }: { users: UserRecord[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deactivate' | 'reactivate' | 'role-change';
    userId: string;
    userName: string;
    newRole?: UserRole;
  } | null>(null);

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleConfirm() {
    if (!confirmAction) return;

    let result;
    if (confirmAction.type === 'deactivate') {
      result = await deactivateUser(confirmAction.userId);
    } else if (confirmAction.type === 'reactivate') {
      result = await reactivateUser(confirmAction.userId);
    } else if (confirmAction.type === 'role-change' && confirmAction.newRole) {
      result = await updateUserRole({ userId: confirmAction.userId, newRole: confirmAction.newRole });
    }

    if (result?.success) {
      toast.success(
        confirmAction.type === 'deactivate'
          ? `${confirmAction.userName} has been deactivated.`
          : confirmAction.type === 'reactivate'
            ? `${confirmAction.userName} has been reactivated.`
            : `${confirmAction.userName}'s role has been updated.`,
      );
    } else {
      toast.error(result?.error ?? 'Action failed.');
    }

    setConfirmAction(null);
    router.refresh();
  }

  const confirmTitle =
    confirmAction?.type === 'deactivate'
      ? 'Deactivate User'
      : confirmAction?.type === 'reactivate'
        ? 'Reactivate User'
        : 'Change Role';

  const confirmDescription =
    confirmAction?.type === 'deactivate'
      ? `This will immediately revoke access for ${confirmAction?.userName}. They will be denied access on their next request.`
      : confirmAction?.type === 'reactivate'
        ? `This will restore access for ${confirmAction?.userName}. They can log in immediately.`
        : `Change ${confirmAction?.userName}'s role to ${confirmAction?.newRole ? ROLE_LABELS[confirmAction.newRole] : ''}?`;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <MagnifyingGlassIcon
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search name or email..."
            className="h-8 w-60 pl-8 text-sm"
            defaultValue={searchParams.get('q') ?? ''}
            onChange={(e) => updateFilter('q', e.target.value || undefined)}
          />
        </div>
        <NativeSelect
          value={searchParams.get('role') ?? ''}
          onChange={(e) => updateFilter('role', e.target.value || undefined)}
          aria-label="Filter by role"
        >
          <NativeSelectOption value="">All Roles</NativeSelectOption>
          {ROLES.map((r) => (
            <NativeSelectOption key={r} value={r}>{ROLE_LABELS[r]}</NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          value={searchParams.get('status') ?? ''}
          onChange={(e) => updateFilter('status', e.target.value || undefined)}
          aria-label="Filter by status"
        >
          <NativeSelectOption value="">All Statuses</NativeSelectOption>
          <NativeSelectOption value="active">Active</NativeSelectOption>
          <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
        </NativeSelect>
        {isPending && <span className="text-xs text-muted-foreground">Loading...</span>}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow
                key={user.id}
                className={user.isActive ? '' : 'opacity-60'}
              >
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[11px]">
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <DotsThreeIcon size={16} weight="bold" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ROLES.filter((r) => r !== user.role).map((role) => (
                        <DropdownMenuItem
                          key={role}
                          onSelect={() =>
                            setConfirmAction({
                              type: 'role-change',
                              userId: user.id,
                              userName: user.name,
                              newRole: role,
                            })
                          }
                        >
                          Set as {ROLE_LABELS[role]}
                        </DropdownMenuItem>
                      ))}
                      {user.isActive ? (
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() =>
                            setConfirmAction({
                              type: 'deactivate',
                              userId: user.id,
                              userName: user.name,
                            })
                          }
                        >
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onSelect={() =>
                            setConfirmAction({
                              type: 'reactivate',
                              userId: user.id,
                              userName: user.name,
                            })
                          }
                        >
                          Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={
          confirmAction?.type === 'deactivate'
            ? 'Deactivate'
            : confirmAction?.type === 'reactivate'
              ? 'Reactivate'
              : 'Change Role'
        }
        onConfirm={handleConfirm}
      />
    </>
  );
}
