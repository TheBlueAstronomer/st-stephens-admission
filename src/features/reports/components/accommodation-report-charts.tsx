'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { AccommodationReport } from '@/features/reports/queries/reports';

const COLORS = ['#525f7f', '#C4A882'];

interface Props {
  report: AccommodationReport;
}

export function AccommodationReportCharts({ report }: Props) {
  const typeData = [
    { name: 'Single', value: report.singleRooms },
    { name: 'Family', value: report.familyUnits },
  ];

  const durationData = [
    { type: 'Single', termTime: 0, fullYear: 0 },
    { type: 'Family', termTime: 0, fullYear: 0 },
  ];

  for (const row of report.rows) {
    const idx = row.type === 'SINGLE' ? 0 : 1;
    if (row.duration === 'TERM_TIME') durationData[idx].termTime++;
    if (row.duration === 'FULL_YEAR') durationData[idx].fullYear++;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Donut */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <h3 className="mb-3 text-sm font-medium text-[#1A2744]">Single vs Family</h3>
        <div className="h-56" style={{ minHeight: 224 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive
                animationDuration={800}
              >
                {typeData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', fontSize: '13px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grouped bar: term-time vs full-year */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-black/6">
        <h3 className="mb-3 text-sm font-medium text-[#1A2744]">Term-time vs Full-year</h3>
        <div className="h-56" style={{ minHeight: 224 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={durationData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecedf6" />
              <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', fontSize: '13px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="termTime" name="Term-time" fill="#525f7f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fullYear" name="Full-year" fill="#C4A882" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
