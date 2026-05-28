'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { STATUS_COLORS } from '@/features/admissions-lifecycle/constants/applicant-status';
import type { ApplicantStatus } from '@/generated/prisma/client';
import type { PipelineReportRow } from '@/features/reports/queries/reports';

interface Props {
  rows: PipelineReportRow[];
}

export function PipelineReportChart({ rows }: Props) {
  const filtered = rows.filter((r) => r.count > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="h-72 w-full" style={{ minHeight: 288 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filtered} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecedf6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#5b5f68' }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', fontSize: '13px' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800}>
            {filtered.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status as ApplicantStatus]?.bg ?? '#dbe2f9'}
                stroke={STATUS_COLORS[entry.status as ApplicantStatus]?.text ?? '#4a5164'}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
