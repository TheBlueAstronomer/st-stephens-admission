'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Alert } from '@/components/ui/alert';
import { InfoIcon, PlusIcon } from '@phosphor-icons/react';
import { createUser } from '@/app/(staff)/admin/users/actions';
import { toast } from 'sonner';
import type { UserRole } from '@/generated/prisma/client';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'ADMISSIONS_STAFF', label: 'Admissions Staff' },
  { value: 'ACADEMIC_STAFF', label: 'Academic Staff' },
  { value: 'SENIOR_LEADERSHIP', label: 'Senior Leadership' },
  { value: 'SYSTEM_ADMINISTRATOR', label: 'System Administrator' },
];

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as UserRole;

    startTransition(async () => {
      const result = await createUser({ name, email, role });
      if (result.success) {
        toast.success(`User ${name} created successfully.`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to create user.');
      }
    });
  }

  return (
    <>
      <Button
        className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90"
        onClick={() => setOpen(true)}
      >
        <PlusIcon size={14} weight="bold" className="mr-1" />
        Invite User
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden" showCloseButton={false}>
          <form onSubmit={handleSubmit}>
            <div className="p-1">
              <div className="rounded-[1.25rem] border border-black/6 bg-white p-6">
                <DialogHeader className="space-y-2 mb-4">
                  <DialogTitle className="text-lg font-semibold text-brand-ink">
                    Invite Staff User
                  </DialogTitle>
                  <DialogDescription>
                    Create a new staff account with an assigned role.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-name">Name *</Label>
                    <Input id="invite-name" name="name" required placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email">Microsoft Email *</Label>
                    <Input id="invite-email" name="email" type="email" required placeholder="name@ssh.ox.ac.uk" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-role">Role *</Label>
                    <NativeSelect name="role" className="w-full" defaultValue="">
                      <NativeSelectOption value="" disabled>
                        Select role...
                      </NativeSelectOption>
                      {ROLE_OPTIONS.map((r) => (
                        <NativeSelectOption key={r.value} value={r.value}>
                          {r.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>

                  <Alert className="text-xs">
                    <InfoIcon size={14} className="mr-1.5 inline-block shrink-0" />
                    The user must have an existing Microsoft account on the SSH tenant.
                  </Alert>
                </div>
              </div>

              <DialogFooter className="mx-0 mb-0 mt-0 rounded-[0_0_1.25rem_1.25rem] border-t border-black/6 bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
                <DialogClose render={<Button variant="outline" className="rounded-full" disabled={isPending} />}>
                  Cancel
                </DialogClose>
                <Button
                  type="submit"
                  className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90"
                  disabled={isPending}
                >
                  Create User
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
