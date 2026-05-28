'use server';

import { requireRole } from '@/lib/require-role';
import { actionSuccess, actionError, type ActionResult } from '@/lib/action-result';
import {
  getDashboardKpis,
  getPipelineByStatus,
  getAccommodationSummary,
  type DashboardFilterParams,
} from '@/features/dashboard/queries/dashboard';

export async function exportDashboardCSV(
  filters: DashboardFilterParams,
): Promise<ActionResult<string>> {
  await requireRole('ADMISSIONS_STAFF', 'SENIOR_LEADERSHIP', 'SYSTEM_ADMINISTRATOR');

  try {
    const [kpis, pipeline, accommodation] = await Promise.all([
      getDashboardKpis(filters),
      getPipelineByStatus(filters),
      getAccommodationSummary(filters),
    ]);

    const rows: string[] = [];
    rows.push('Section,Metric,Value');

    // KPI row
    rows.push(`KPI,Total Enquiries,${kpis.totalEnquiries}`);
    rows.push(`KPI,Interviews,${kpis.totalInterviews}`);
    rows.push(`KPI,Offers,${kpis.totalOffers}`);
    rows.push(`KPI,Registrations,${kpis.totalRegistrations}`);
    rows.push(`KPI,Confirmed Ordinands,${kpis.confirmedOrdinands}`);
    rows.push(`KPI,Accommodation Demand,${kpis.accommodationDemand}`);

    rows.push('');
    rows.push('Status,Label,Count');
    for (const stage of pipeline) {
      rows.push(`Pipeline,${stage.label},${stage.count}`);
    }

    rows.push('');
    rows.push('Accommodation,Type,Count');
    rows.push(`Accommodation,Single Rooms,${accommodation.singleRooms}`);
    rows.push(`Accommodation,Family Units,${accommodation.familyUnits}`);
    rows.push(`Accommodation,Term-time,${accommodation.termTime}`);
    rows.push(`Accommodation,Full-year,${accommodation.fullYear}`);
    rows.push(`Accommodation,Total Demand,${accommodation.totalDemand}`);

    return actionSuccess(rows.join('\n'));
  } catch (err) {
    return actionError('Failed to export dashboard data.');
  }
}
