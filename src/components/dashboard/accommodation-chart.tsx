'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { AccommodationSummary } from '@/lib/queries/dashboard';

interface AccommodationChartProps {
  data: AccommodationSummary;
}

const COLORS = ['#525f7f', '#C4A882'];

export function AccommodationChart({ data }: AccommodationChartProps) {
  const chartData = [
    { name: 'Single Rooms', value: data.singleRooms },
    { name: 'Family Units', value: data.familyUnits },
  ];

  if (data.totalDemand === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No accommodation data
      </div>
    );
  }

  return (
    <div className="h-64 w-full" style={{ minHeight: 256 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            isAnimationActive="auto"
            animationDuration={240}
            animationEasing="ease-out"
          >
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '0.75rem',
              border: '1px solid rgba(0,0,0,0.06)',
              fontSize: '13px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[#1A2744] text-lg font-bold"
          >
            {data.totalDemand}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
