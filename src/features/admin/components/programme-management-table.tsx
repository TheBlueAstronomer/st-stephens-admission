'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { DotsThreeIcon, PlusIcon } from '@phosphor-icons/react';
import { createProgramme, updateProgramme } from '@/features/admin/actions/programme-actions';
import { toast } from 'sonner';
import type { AwardingFramework, ModeOfStudy } from '@/generated/prisma/client';

interface ProgrammeRecord {
  id: string;
  courseTitle: string;
  awardingFramework: AwardingFramework;
  modeOfStudy: ModeOfStudy;
  durationOfStudy: string | null;
  isActive: boolean;
  _count: { applicants: number };
}

const FRAMEWORK_LABELS: Record<AwardingFramework, string> = {
  COMMON_AWARDS: 'Common Awards',
  OXFORD: 'Oxford',
};

const MODE_LABELS: Record<ModeOfStudy, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  OTHER: 'Other',
};

export function ProgrammeManagementTable({ programmes }: { programmes: ProgrammeRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editTarget, setEditTarget] = useState<ProgrammeRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<ProgrammeRecord | null>(null);

  function openNewSheet() {
    setEditTarget(null);
    setIsNew(true);
    setSheetOpen(true);
  }

  function openEditSheet(p: ProgrammeRecord) {
    setEditTarget(p);
    setIsNew(false);
    setSheetOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const courseTitle = fd.get('courseTitle') as string;
    const awardingFramework = fd.get('awardingFramework') as AwardingFramework;
    const modeOfStudy = fd.get('modeOfStudy') as ModeOfStudy;
    const durationOfStudy = fd.get('durationOfStudy') as string;

    startTransition(async () => {
      const result = isNew
        ? await createProgramme({ courseTitle, awardingFramework, modeOfStudy, durationOfStudy })
        : await updateProgramme(editTarget!.id, { courseTitle, awardingFramework, modeOfStudy, durationOfStudy });

      if (result.success) {
        toast.success(isNew ? 'Programme created.' : 'Programme updated.');
        setSheetOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed.');
      }
    });
  }

  async function handleDeactivate() {
    if (!confirmDeactivate) return;
    const result = await updateProgramme(confirmDeactivate.id, { isActive: false });
    if (result.success) {
      toast.success(`${confirmDeactivate.courseTitle} deactivated.`);
      router.refresh();
    } else {
      toast.error(result.error ?? 'Failed.');
    }
    setConfirmDeactivate(null);
  }

  async function handleReactivate(p: ProgrammeRecord) {
    const result = await updateProgramme(p.id, { isActive: true });
    if (result.success) {
      toast.success(`${p.courseTitle} reactivated.`);
      router.refresh();
    } else {
      toast.error(result.error ?? 'Failed.');
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90" onClick={openNewSheet}>
          <PlusIcon size={14} weight="bold" className="mr-1" />
          New Programme
        </Button>
      </div>

      <div className="rounded-xl bg-white ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Title</TableHead>
              <TableHead>Framework</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {programmes.map((p) => (
              <TableRow key={p.id} className={p.isActive ? '' : 'opacity-60'}>
                <TableCell className="font-medium">{p.courseTitle}</TableCell>
                <TableCell>{FRAMEWORK_LABELS[p.awardingFramework]}</TableCell>
                <TableCell>{MODE_LABELS[p.modeOfStudy]}</TableCell>
                <TableCell>
                  {p.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
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
                      <DropdownMenuItem onSelect={() => openEditSheet(p)}>Edit</DropdownMenuItem>
                      {p.isActive ? (
                        <DropdownMenuItem className="text-destructive" onSelect={() => setConfirmDeactivate(p)}>
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => handleReactivate(p)}>Reactivate</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit / New Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md p-6">
          <SheetHeader>
            <SheetTitle>{isNew ? 'New Programme' : 'Edit Programme'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prog-title">Course Title *</Label>
              <Input id="prog-title" name="courseTitle" required defaultValue={editTarget?.courseTitle ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prog-framework">Framework *</Label>
              <NativeSelect name="awardingFramework" className="w-full" defaultValue={editTarget?.awardingFramework ?? 'COMMON_AWARDS'}>
                <NativeSelectOption value="COMMON_AWARDS">Common Awards</NativeSelectOption>
                <NativeSelectOption value="OXFORD">Oxford</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prog-mode">Mode *</Label>
              <NativeSelect name="modeOfStudy" className="w-full" defaultValue={editTarget?.modeOfStudy ?? 'FULL_TIME'}>
                <NativeSelectOption value="FULL_TIME">Full-time</NativeSelectOption>
                <NativeSelectOption value="PART_TIME">Part-time</NativeSelectOption>
                <NativeSelectOption value="OTHER">Other</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prog-duration">Duration</Label>
              <Input id="prog-duration" name="durationOfStudy" defaultValue={editTarget?.durationOfStudy ?? ''} placeholder="e.g. 3 years" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90" disabled={isPending}>
                {isNew ? 'Create' : 'Save'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Deactivate Confirmation */}
      <ConfirmationDialog
        open={!!confirmDeactivate}
        onOpenChange={(open) => !open && setConfirmDeactivate(null)}
        title="Deactivate Programme"
        description={
          confirmDeactivate
            ? `This programme is assigned to ${confirmDeactivate._count.applicants} applicant(s). Deactivating will hide it from new records but not remove it from existing ones.`
            : ''
        }
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
      />
    </>
  );
}
