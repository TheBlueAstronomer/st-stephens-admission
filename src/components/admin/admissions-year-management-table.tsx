'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusIcon, StarIcon } from '@phosphor-icons/react';
import { createAdmissionsYear, setCurrentYear } from '@/app/(staff)/admin/admissions-years/actions';
import { toast } from 'sonner';

interface YearRecord {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isActive: boolean;
  _count: { applicants: number };
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function AdmissionsYearManagementTable({ years }: { years: YearRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const label = fd.get('label') as string;
    const startDate = fd.get('startDate') as string;
    const endDate = fd.get('endDate') as string;
    const isCurrent = fd.get('isCurrent') === 'on';

    startTransition(async () => {
      const result = await createAdmissionsYear({ label, startDate, endDate, isCurrent });
      if (result.success) {
        toast.success('Admissions year created.');
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed.');
      }
    });
  }

  async function handleSetCurrent(yearId: string) {
    const result = await setCurrentYear(yearId);
    if (result.success) {
      toast.success('Current year updated.');
      router.refresh();
    } else {
      toast.error(result.error ?? 'Failed.');
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90" onClick={() => setDialogOpen(true)}>
          <PlusIcon size={14} weight="bold" className="mr-1" />
          New Year
        </Button>
      </div>

      <div className="rounded-xl bg-white ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Applicants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {years.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No admissions years configured.
                </TableCell>
              </TableRow>
            )}
            {years.map((y) => (
              <TableRow key={y.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    {y.label}
                    {y.isCurrent && (
                      <StarIcon size={14} weight="fill" className="text-amber-500" />
                    )}
                  </span>
                </TableCell>
                <TableCell>{formatDate(y.startDate)}</TableCell>
                <TableCell>{formatDate(y.endDate)}</TableCell>
                <TableCell className="text-muted-foreground">{y._count.applicants}</TableCell>
                <TableCell>
                  {y.isCurrent ? (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">Current</Badge>
                  ) : y.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!y.isCurrent && y.isActive && (
                    <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => handleSetCurrent(y.id)}>
                      Set Current
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden" showCloseButton={false}>
          <form onSubmit={handleSubmit}>
            <div className="p-1">
              <div className="rounded-[1.25rem] border border-black/6 bg-white p-6">
                <DialogHeader className="space-y-2 mb-4">
                  <DialogTitle className="text-lg font-semibold text-brand-ink">
                    New Admissions Year
                  </DialogTitle>
                  <DialogDescription>
                    Create a new admissions cycle.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="year-label">Label *</Label>
                    <Input id="year-label" name="label" required placeholder="e.g. 2026/27" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="year-start">Start Date *</Label>
                      <Input id="year-start" name="startDate" type="date" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="year-end">End Date *</Label>
                      <Input id="year-end" name="endDate" type="date" required />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="year-current" name="isCurrent" />
                    <Label htmlFor="year-current" className="text-sm font-normal">
                      Set as current admissions year
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter className="mx-0 mb-0 mt-0 rounded-[0_0_1.25rem_1.25rem] border-t border-black/6 bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
                <DialogClose render={<Button variant="outline" className="rounded-full" disabled={isPending} />}>
                  Cancel
                </DialogClose>
                <Button type="submit" className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90" disabled={isPending}>
                  Create
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
