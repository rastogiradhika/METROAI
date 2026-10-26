import { DEMO_ALERTS } from '../mocks/sampleData';
import type { CrowdAlert, AlertStatus } from '../types/alert';
import { apiGet, apiPatch } from './apiClient';

let _alerts: CrowdAlert[] = [...DEMO_ALERTS];

// Auto-sync alerts from backend
apiGet<{ alerts: CrowdAlert[]; total: number }>('/alerts')
  .then(data => {
    if (data?.alerts && data.alerts.length > 0) {
      _alerts = data.alerts;
    }
  })
  .catch(err => {
    console.debug('AlertService: Using default alerts:', err.message);
  });

export function getAllAlerts(): CrowdAlert[] {
  return _alerts;
}

export function getAlertsByStation(stationId: string): CrowdAlert[] {
  return _alerts.filter(a => a.stationId === stationId);
}

export function getAlertsByStatus(status: AlertStatus): CrowdAlert[] {
  return _alerts.filter(a => a.status === status);
}

export function getPassengerAlerts(): CrowdAlert[] {
  // Only crowd-level alerts relevant to passengers
  return _alerts.filter(a => a.type === 'crowd_high' || a.type === 'crowd_critical');
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  _alerts = _alerts.map(a => a.id === alertId ? { ...a, status: 'acknowledged' as AlertStatus } : a);
  try {
    await apiPatch(`/alerts/${alertId}`, { status: 'acknowledged' });
  } catch (err) {
    console.warn('Failed to update alert on backend:', err);
  }
}
