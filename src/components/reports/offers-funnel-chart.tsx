'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { OffersRegistrationsReport } from '@/lib/queries/reports';

interface Props {
  report: OffersRegistrationsReport;
}

export function OffersRegistrationsFunnel({ report }: Props) {
  const data = [
    { stage: 'Conditional Offers', count: report.conditionalOffers },
    { stage: 'Unconditional Offers', count: report.unconditionalOffers },
    { stage: 'Accepted Offers', count: report.acceptedOffers },
    { stage: 'Registrations', count: report.registrationsReceived },
    { stage: 'Confirmed', count: report.confirmedOrdinands },
  ];

  return (
    <div className="h-64 w-full" style={{ minHeight: 256 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ecedf6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#5b5f68' }} tickLine={false} axisLine={false} width={140} />
          <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', fontSize: '13px' }} />
          <Bar dataKey="count" fill="#525f7f" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
