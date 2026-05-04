'use client';

import { useState } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  exportPipelineCSV,
  exportDioceseCSV,
  exportBapCSV,
  exportOffersRegistrationsCSV,
  exportAccommodationCSV,
  exportMissingDocsCSV,
} from '@/app/(staff)/reports/actions';
import type { ReportFilterParams } from '@/lib/queries/reports';

const ACTION_MAP = {
  pipeline: exportPipelineCSV,
  diocese: exportDioceseCSV,
  bap: exportBapCSV,
  offersRegistrations: exportOffersRegistrationsCSV,
  accommodation: exportAccommodationCSV,
  missingDocs: exportMissingDocsCSV,
} as const;

export type ReportActionId = keyof typeof ACTION_MAP;

interface CsvExportButtonProps {
  actionId: ReportActionId;
  filters: ReportFilterParams;
  filename: string;
}

export function CsvExportButton({ actionId, filters, filename }: CsvExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const action = ACTION_MAP[actionId];
      const result = await action(filters);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
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
      className="rounded-full"
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? (
        <Spinner />
      ) : (
        <DownloadSimpleIcon size={15} weight="light" className="mr-1.5" />
      )}
      Export CSV
    </Button>
  );
}
