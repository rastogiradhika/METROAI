export type AlertType = 'crowd_high' | 'crowd_critical' | 'system_data' | 'service_disruption' | 'passenger_report';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type ReportStatus = 'new' | 'reviewed' | 'flagged' | 'expired';
export type ReportType = 'high_crowd' | 'overcrowding' | 'safety_concern' | 'other';

export interface CrowdAlert {
  id: string;
  stationId: string;
  platformId: string;
  stationName: string;
  platformName: string;
  type: AlertType;
  message: string;
  createdAt: string; // ISO string
  status: AlertStatus;
  isDemo: true;
}

export interface PassengerReport {
  id: string;
  stationId: string;
  platformId: string;
  stationName: string;
  platformName: string;
  reportType: ReportType;
  reportedAt: string; // ISO string
  status: ReportStatus;
  isDemo: true;
  source: 'passenger';
}
