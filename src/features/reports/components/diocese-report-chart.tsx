'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { DioceseReportRow } from '@/features/reports/queries/reports';

interface Props {
  rows: DioceseReportRow[];
}

export function DioceseReportChart({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No diocese data
      </div>
    );
  }

  return (
    <div className="h-72 w-full" style={{ minHeight: 288 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecedf6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="dioceseName" tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} width={100} />
          <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', fontSize: '13px' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="applicantCount" name="Applicants" fill="#525f7f" radius={[0, 4, 4, 0]} />
          <Bar dataKey="offerCount" name="Offers" fill="#C4A882" radius={[0, 4, 4, 0]} />
          <Bar dataKey="confirmedOrdinandCount" name="Confirmed" fill="#4a7c59" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
