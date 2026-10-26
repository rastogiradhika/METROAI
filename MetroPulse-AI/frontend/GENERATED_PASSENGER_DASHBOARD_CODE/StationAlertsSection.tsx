import React from 'react';
import type { CrowdAlert } from '../../types/alert';

interface StationAlertsSectionProps {
  stationName: string;
  alerts: CrowdAlert[];
}

function formatAlertTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export const StationAlertsSection: React.FC<StationAlertsSectionProps> = ({
  stationName,
  alerts,
}) => {
  return (
    <div className="station-alerts-panel" role="region" aria-label={`Passenger crowd alerts for ${stationName}`}>
      <div className="section-title-wrap">
        <h3 className="section-heading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Active Crowd Advisories & Alerts
        </h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-body)', fontWeight: 500 }}>
          Station Safety & Commuter Notices
        </span>
      </div>

      {alerts.length > 0 ? (
        <div className="alerts-list-stack">
          {alerts.map((alert) => {
            const isCritical = alert.type === 'crowd_critical';
            const isHigh = alert.type === 'crowd_high';
            const alertClass = isCritical ? 'alert-critical' : isHigh ? 'alert-high' : '';

            return (
              <div key={alert.id} className={`passenger-alert-item ${alertClass}`}>
                <div className="passenger-alert-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isCritical ? '#dc2626' : '#ea580c'} strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>

                <div className="passenger-alert-content">
                  <div className="passenger-alert-header-row">
                    <span className="passenger-alert-title">
                      {isCritical ? 'Critical Congestion Warning' : 'High Crowd Advisory'} — {alert.platformName || 'Station Platforms'}
                    </span>
                    <span className="demo-data-badge">DEMO DATA</span>
                  </div>

                  <p className="passenger-alert-msg">{alert.message}</p>

                  <div className="passenger-alert-time">
                    Posted at {formatAlertTime(alert.createdAt)} • Status: {alert.status.toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="alerts-empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className="alerts-empty-title">No Active Crowd Advisories</div>
          <p className="alerts-empty-desc">
            Passenger traffic at {stationName} is currently flowing normally. No critical chokepoints or high crowding warnings reported.
          </p>
        </div>
      )}
    </div>
  );
};

export default StationAlertsSection;
