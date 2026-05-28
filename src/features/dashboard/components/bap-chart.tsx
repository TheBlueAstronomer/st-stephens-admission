'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { BapSummaryStage } from '@/features/dashboard/queries/dashboard';

interface BapChartProps {
  stageOne: BapSummaryStage[];
  stageTwo: BapSummaryStage[];
}

export function BapChart({ stageOne, stageTwo }: BapChartProps) {
  const statuses = ['COMPLETED', 'SCHEDULED', 'INCOMPLETE', 'NOT_APPLICABLE'];
  const s1Map = new Map(stageOne.map((s) => [s.status, s.count]));
  const s2Map = new Map(stageTwo.map((s) => [s.status, s.count]));

  const data = statuses.map((s) => ({
    status: s.replace('_', ' '),
    'Stage 1': s1Map.get(s) ?? 0,
    'Stage 2': s2Map.get(s) ?? 0,
  }));

  return (
    <div className="h-64 w-full" style={{ minHeight: 256 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecedf6" />
          <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', fontSize: '13px' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar
            dataKey="Stage 1"
            fill="#525f7f"
            radius={[4, 4, 0, 0]}
            isAnimationActive="auto"
            animationDuration={240}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="Stage 2"
            fill="#C4A882"
            radius={[4, 4, 0, 0]}
            isAnimationActive="auto"
            animationDuration={240}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
