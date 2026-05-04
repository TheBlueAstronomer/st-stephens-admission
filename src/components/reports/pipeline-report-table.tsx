'use client';

import type { PipelineReportRow, PipelineByProgramme } from '@/lib/queries/reports';

interface Props {
  rows: PipelineReportRow[];
  programmeBreakdown: PipelineByProgramme[];
  total: number;
}

export function PipelineReportTable({ rows, programmeBreakdown, total }: Props) {
  const programmes = programmeBreakdown.map((p) => p.programmeName);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 pr-4">Status</th>
            {programmes.map((p) => (
              <th key={p} className="pb-2 pr-4 text-right">{p}</th>
            ))}
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter((r) => r.count > 0).map((row) => (
            <tr key={row.status} className="border-b border-black/5">
              <td className="py-2 pr-4 font-medium text-[#1A2744]">{row.label}</td>
              {programmeBreakdown.map((p) => (
                <td key={p.programmeName} className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                  {p.counts[row.status] ?? 0}
                </td>
              ))}
              <td className="py-2 text-right tabular-nums font-medium">{row.count}</td>
            </tr>
          ))}
          <tr className="font-medium">
            <td className="pt-3 pr-4 text-[#1A2744]">Total</td>
            {programmeBreakdown.map((p) => {
              const progTotal = Object.values(p.counts).reduce((sum, c) => sum + c, 0);
              return (
                <td key={p.programmeName} className="pt-3 pr-4 text-right tabular-nums">
                  {progTotal}
                </td>
              );
            })}
            <td className="pt-3 text-right tabular-nums">{total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
