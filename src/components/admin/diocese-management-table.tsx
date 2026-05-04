'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon, PlusIcon, PencilSimpleIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { createDiocese, updateDiocese } from '@/app/(staff)/admin/dioceses/actions';
import { toast } from 'sonner';

interface DioceseRecord {
  id: string;
  name: string;
  isActive: boolean;
  _count: { applicants: number };
}

export function DioceseManagementTable({ dioceses }: { dioceses: DioceseRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');

  const filtered = dioceses.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  function startEdit(d: DioceseRecord) {
    setEditingId(d.id);
    setEditValue(d.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      const result = await updateDiocese(id, editValue);
      if (result.success) {
        toast.success('Diocese updated.');
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed.');
      }
    });
  }

  function addNew() {
    startTransition(async () => {
      const result = await createDiocese(newName);
      if (result.success) {
        toast.success('Diocese added.');
        setAddingNew(false);
        setNewName('');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed.');
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          <MagnifyingGlassIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 w-60 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          className="rounded-full bg-brand-solid text-brand-solid-foreground hover:bg-brand-solid/90"
          onClick={() => { setAddingNew(true); setNewName(''); }}
        >
          <PlusIcon size={14} weight="bold" className="mr-1" />
          Add Diocese
        </Button>
      </div>

      <div className="rounded-xl bg-white ring-1 ring-black/6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Applicants</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addingNew && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Diocese name"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addNew();
                      if (e.key === 'Escape') setAddingNew(false);
                    }}
                  />
                </TableCell>
                <TableCell />
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={addNew} disabled={isPending}>
                      <CheckIcon size={14} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setAddingNew(false)}>
                      <XIcon size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.length === 0 && !addingNew && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No dioceses found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  {editingId === d.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(d.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                  ) : (
                    <span className="font-medium">{d.name}</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{d._count.applicants}</TableCell>
                <TableCell>
                  {editingId === d.id ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => saveEdit(d.id)} disabled={isPending}>
                        <CheckIcon size={14} />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={cancelEdit}>
                        <XIcon size={14} />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(d)}>
                      <PencilSimpleIcon size={14} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
