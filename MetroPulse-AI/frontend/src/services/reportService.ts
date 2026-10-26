import { DEMO_PASSENGER_REPORTS } from '../mocks/sampleData';
import type { PassengerReport, ReportType } from '../types/alert';
import { apiPost, apiGet } from './apiClient';

let _reports = [...DEMO_PASSENGER_REPORTS];

export function getAllReports(): PassengerReport[] {
  return _reports;
}

export async function fetchAllReportsAsync(): Promise<PassengerReport[]> {
  try {
    const data = await apiGet<{ reports: PassengerReport[]; total: number }>('/reports');
    if (data?.reports) {
      _reports = data.reports;
      return _reports;
    }
  } catch (err) {
    console.warn('Backend unavailable, using cached reports:', err);
  }
  return _reports;
}

export function submitReport(
  stationId: string,
  platformId: string,
  stationName: string,
  platformName: string,
  reportType: ReportType
): PassengerReport {
  const report: PassengerReport = {
    id: `rpt-${Date.now()}`,
    stationId,
    platformId,
    stationName,
    platformName,
    reportType,
    reportedAt: new Date().toISOString(),
    status: 'new',
    isDemo: true,
    source: 'passenger',
  };
  _reports = [report, ..._reports];

  // Asynchronously send to backend
  apiPost('/reports', {
    stationId,
    platformId,
    stationName,
    platformName,
    reportType,
  }).catch(err => {
    console.warn('Could not persist report to backend:', err);
  });

  return report;
}

export function updateReportStatus(
  reportId: string,
  status: PassengerReport['status']
): void {
  _reports = _reports.map(r => r.id === reportId ? { ...r, status } : r);
}

export function resetReports(): void {
  _reports = [...DEMO_PASSENGER_REPORTS];
}
