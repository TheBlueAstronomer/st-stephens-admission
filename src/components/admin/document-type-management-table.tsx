'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { DotsThreeIcon, PlusIcon } from '@phosphor-icons/react';
import { createDocumentType, updateDocumentType } from '@/app/(staff)/admin/document-types/actions';
import { toast } from 'sonner';

interface DocTypeRecord {
  id: string;
  name: string;
  slug: string;
  isRequired: boolean;
  isSensitive: boolean;
  isActive: boolean;
  _count: { documents: number };
}

export function DocumentTypeManagementTable({ documentTypes }: { documentTypes: DocTypeRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DocTypeRecord | null>(null);
  const [isNew, setIsNew] = useState(false);

  function openNew() {
    setEditTarget(null);
    setIsNew(true);
    setSheetOpen(true);
  }

  function openEdit(dt: DocTypeRecord) {
    setEditTarget(dt);
    setIsNew(false);
    setSheetOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const slug = fd.get('slug') as string;
    const isRequired = fd.get('isRequired') === 'on';
    const isSensitive = fd.get('isSensitive') === 'on';

    startTransition(async () => {
      const result = isNew
        ? await createDocumentType({ name, slug, isRequired, isSensitive })
        : await updateDocumentType(editTarget!.id, { name, isRequired, isSensitive });

      if (result.success) {
        toast.success(isNew ? 'Document type created.' : 'Document type updated.');
        setSheetOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed.');
      }
    });
  }

  async function toggleActive(dt: DocTypeRecord) {
    const result = await updateDocumentType(dt.id, { isActive: !dt.isActive });
    if (result.success) {
      toast.success(dt.isActive ? 'Deactivated.' : 'Reactivated.');
      router.refresh();
    } else {
      toast.error(result.error ?? 'Failed.');
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90" onClick={openNew}>
          <PlusIcon size={14} weight="bold" className="mr-1" />
          New Document Type
        </Button>
      </div>

      <div className="rounded-xl bg-white ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Sensitive</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No document types configured.
                </TableCell>
              </TableRow>
            )}
            {documentTypes.map((dt) => (
              <TableRow key={dt.id} className={dt.isActive ? '' : 'opacity-60'}>
                <TableCell className="font-medium">{dt.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{dt.slug}</code>
                </TableCell>
                <TableCell>{dt.isRequired ? 'Yes' : 'No'}</TableCell>
                <TableCell>{dt.isSensitive ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  {dt.isActive ? (
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
                      <DropdownMenuItem onSelect={() => openEdit(dt)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toggleActive(dt)}>
                        {dt.isActive ? 'Deactivate' : 'Reactivate'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md p-6">
          <SheetHeader>
            <SheetTitle>{isNew ? 'New Document Type' : 'Edit Document Type'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dt-name">Display Name *</Label>
              <Input id="dt-name" name="name" required defaultValue={editTarget?.name ?? ''} />
            </div>
            {isNew && (
              <div className="space-y-1.5">
                <Label htmlFor="dt-slug">Internal Key *</Label>
                <Input id="dt-slug" name="slug" required placeholder="e.g. DBS_CHECK" defaultValue="" />
                <p className="text-xs text-muted-foreground">Auto-uppercased. Cannot be changed later.</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="dt-required" name="isRequired" defaultChecked={editTarget?.isRequired ?? false} />
              <Label htmlFor="dt-required" className="text-sm font-normal">Required for all applicants</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="dt-sensitive" name="isSensitive" defaultChecked={editTarget?.isSensitive ?? false} />
              <Label htmlFor="dt-sensitive" className="text-sm font-normal">Contains sensitive data</Label>
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
    </>
  );
}
