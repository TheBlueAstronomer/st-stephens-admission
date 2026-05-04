'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DioceseDistribution } from '@/lib/queries/dashboard';

interface DioceseChartProps {
  data: DioceseDistribution[];
}

export function DioceseChart({ data }: DioceseChartProps) {
  const top8 = data.slice(0, 8);

  if (top8.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No diocese data
      </div>
    );
  }

  return (
    <div className="h-64 w-full" style={{ minHeight: 256 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top8} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecedf6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#5b5f68' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="dioceseName"
            tick={{ fontSize: 11, fill: '#5b5f68' }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '0.75rem',
              border: '1px solid rgba(0,0,0,0.06)',
              fontSize: '13px',
            }}
          />
          <Bar
            dataKey="applicantCount"
            fill="#525f7f"
            radius={[0, 6, 6, 0]}
            isAnimationActive={true}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
