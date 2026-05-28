'use client';

import { useState } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { exportDashboardCSV } from '@/features/dashboard/actions/dashboard-actions';
import type { DashboardFilterParams } from '@/features/dashboard/queries/dashboard';

interface DashboardExportButtonProps {
  filters: DashboardFilterParams;
}

export function DashboardExportButton({ filters }: DashboardExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportDashboardCSV(filters);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ssh-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? <Spinner /> : <DownloadSimpleIcon size={15} weight="light" className="mr-1.5" />}
      Export All
    </Button>
  );
}
