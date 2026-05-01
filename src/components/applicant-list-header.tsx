'use client';

import { useState } from 'react';
import { PlusIcon, UploadIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { CreateApplicantSheet } from '@/components/create-applicant-sheet';

interface ReferenceData {
  programmes: { id: string; courseTitle: string }[];
  dioceses: { id: string; name: string }[];
  admissionsYears: { id: string; label: string; isCurrent: boolean }[];
}

interface ApplicantListHeaderProps {
  canMutate: boolean;
  currentYear?: string;
  referenceData: ReferenceData;
}

export function ApplicantListHeader({
  canMutate,
  currentYear,
  referenceData,
}: ApplicantListHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A2744]">
          Applicants
        </h1>
        {currentYear && (
          <p className="text-sm text-muted-foreground">
            {currentYear} admissions cycle
          </p>
        )}
      </div>

      {canMutate && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-black/8 text-muted-foreground hover:text-[#1A2744] hover:border-[#1A2744]/20"
          >
            <UploadIcon size={15} weight="light" className="mr-1.5" />
            Import
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-[#1A2744] text-white hover:bg-[#23304d] shadow-sm shadow-[#1A2744]/20"
            onClick={() => setSheetOpen(true)}
          >
            <PlusIcon size={15} weight="bold" className="mr-1.5" />
            New Applicant
          </Button>

          <CreateApplicantSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            referenceData={referenceData}
          />
        </div>
      )}
    </div>
  );
}
