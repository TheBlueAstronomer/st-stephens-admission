import { ReportNav } from '@/components/reports/report-nav';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1A2744]">Reports</h1>
      <div className="flex gap-6">
        <ReportNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
