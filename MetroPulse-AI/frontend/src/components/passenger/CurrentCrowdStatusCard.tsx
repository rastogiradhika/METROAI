import React from 'react';
import type { CrowdLevel, CrowdObservation } from '../../types/crowd';

interface CurrentCrowdStatusCardProps {
  stationName: string;
  platformName?: string;
  observation?: CrowdObservation;
}

const levelBadgeConfig: Record<CrowdLevel, { label: string; badgeClass: string; icon: string; description: string }> = {
  low: {
    label: 'Low Crowd',
    badgeClass: 'badge-crowd-low',
    icon: '●',
    description: 'Platform has ample free capacity. Boarding and alighting are smooth.',
  },
  moderate: {
    label: 'Moderate Crowd',
    badgeClass: 'badge-crowd-moderate',
    icon: '●',
    description: 'Moderate commuter density. Queues expected near coach doors.',
  },
  high: {
    label: 'High Crowd',
    badgeClass: 'badge-crowd-high',
    icon: '▲',
    description: 'High commuter density. Boarding queues and platform wait times elevated.',
  },
  critical: {
    label: 'Critical Crowd',
    badgeClass: 'badge-crowd-critical',
    icon: '⚠',
    description: 'Extremely heavy congestion. Gate staggering or alternate departure advised.',
  },
  unavailable: {
    label: 'Data Unavailable',
    badgeClass: 'badge-crowd-unavailable',
    icon: '○',
    description: 'No verified sensor or observation data recorded for this platform.',
  },
};

function formatTimestamp(isoString?: string): string {
  if (!isoString) return 'Data unavailable';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return 'Data unavailable';
  }
}

export const CurrentCrowdStatusCard: React.FC<CurrentCrowdStatusCardProps> = ({
  stationName,
  platformName,
  observation,
}) => {
  const crowdLevel: CrowdLevel = observation?.crowdLevel || 'unavailable';
  const config = levelBadgeConfig[crowdLevel] || levelBadgeConfig.unavailable;

  // Reliability check for count
  const hasReliableCount =
    observation?.personCount !== null && observation?.personCount !== undefined;
  const personCount = observation?.personCount;

  // Reliability check for trend
  const trend = observation?.trend;
  let trendElement: React.ReactNode;
  if (trend === 'rising') {
    trendElement = <span className="trend-indicator trend-rising">▲ Rising (Increasing Flow)</span>;
  } else if (trend === 'falling') {
    trendElement = <span className="trend-indicator trend-falling">▼ Falling (Clearing)</span>;
  } else if (trend === 'stable') {
    trendElement = <span className="trend-indicator trend-stable">◆ Stable Density</span>;
  } else {
    trendElement = <span className="trend-indicator trend-insufficient">Insufficient data</span>;
  }

  // Data source & timestamp
  const updatedTime = observation?.observedAt ? formatTimestamp(observation.observedAt) : 'Data unavailable';
  const dataSource = observation?.sourceName || (observation?.source ? `${observation.source.toUpperCase()} Feed` : 'Data unavailable');

  return (
    <div className="current-crowd-card" role="region" aria-label={`Current crowd status for ${stationName}`}>
      <div className="current-crowd-header">
        <div className="crowd-station-info">
          <h3 className="crowd-station-title">{stationName}</h3>
          <div className="crowd-platform-subtitle">
            {platformName ? platformName : 'Platform data unavailable'}
          </div>
        </div>
        <div className={`crowd-level-badge ${config.badgeClass}`} aria-live="polite">
          <span aria-hidden="true">{config.icon}</span>
          <span>{config.label}</span>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-body)', lineHeight: 1.5 }}>
        {config.description}
      </p>

      {/* Metrics Row: Count & Trend */}
      <div className="crowd-metrics-row">
        <div className="crowd-metric-item">
          <span className="crowd-metric-label">Estimated Occupancy</span>
          <div className="crowd-metric-val">
            {hasReliableCount && personCount !== null && personCount !== undefined ? (
              <span className="crowd-count-number">~{personCount.toLocaleString()}</span>
            ) : (
              <span style={{ fontSize: '0.95rem', color: 'var(--color-body)', fontWeight: 600 }}>Data unavailable</span>
            )}
            {hasReliableCount && <span style={{ fontSize: '0.8rem', color: 'var(--color-body)', fontWeight: 500 }}>people</span>}
          </div>
        </div>

        <div className="crowd-metric-item">
          <span className="crowd-metric-label">Crowd Trend</span>
          <div className="crowd-metric-val">
            {trendElement}
          </div>
        </div>
      </div>

      {/* Footer: Last Updated & Data Source */}
      <div className="crowd-card-footer">
        <div className="crowd-source-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Last updated: {updatedTime}</span>
        </div>

        <div className="crowd-source-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>Source: {dataSource}</span>
        </div>
      </div>
    </div>
  );
};

export default CurrentCrowdStatusCard;
