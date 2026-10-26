import type { CrowdLevel } from '../../types/crowd';

interface CrowdStatusCardProps {
  stationName: string;
  platformName?: string;
  crowdLevel: CrowdLevel;
  personCount: number | null;
  observedAt?: string;
  showTimestamp?: boolean;
}

const levelConfig: Record<CrowdLevel, { label: string; className: string; description: string; icon: string }> = {
  low:         { label: 'Low Crowd',       className: 'crowd-low',         description: 'Station is comfortable. Plenty of space.', icon: '🟢' },
  moderate:    { label: 'Moderate Crowd',  className: 'crowd-moderate',    description: 'Moderate crowd. Expect some waiting.', icon: '🟡' },
  high:        { label: 'High Crowd',      className: 'crowd-high',        description: 'High density. Expect crowding and delays.', icon: '🟠' },
  critical:    { label: 'Critical Crowd',  className: 'crowd-critical',    description: 'Extremely crowded. Consider alternatives.', icon: '🔴' },
  unavailable: { label: 'Data Unavailable', className: 'crowd-unavailable', description: 'No crowd data available for this station.', icon: '⬜' },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function CrowdStatusCard({ stationName, platformName, crowdLevel, personCount, observedAt, showTimestamp = false }: CrowdStatusCardProps) {
  const config = levelConfig[crowdLevel];

  return (
    <div className={`crowd-status-card ${config.className}`} role="region" aria-label={`Crowd status: ${config.label}`}>
      <div className="csc-header">
        <div className="csc-location">
          <span className="csc-station">{stationName}</span>
          {platformName && <span className="csc-platform">{platformName}</span>}
        </div>
        <span className={`badge badge-${crowdLevel === 'unavailable' ? 'unavailable' : crowdLevel}`}>
          {config.icon} {config.label}
        </span>
      </div>

      <div className="csc-body">
        <div className="csc-level-bar-track" aria-hidden="true">
          <div className={`csc-level-bar csc-bar-${crowdLevel}`} />
        </div>
        <p className="csc-description">{config.description}</p>
        {crowdLevel !== 'unavailable' && (
          <div className="csc-count">
            {personCount !== null
              ? <><span className="csc-count-value">~{personCount.toLocaleString()}</span><span className="csc-count-label"> persons observed</span></>
              : <span className="csc-count-label">Count not available</span>
            }
          </div>
        )}
        {showTimestamp && observedAt && (
          <div className="csc-timestamp">Observed at {formatTime(observedAt)}</div>
        )}
      </div>

      {/* Legend */}
      <div className="csc-legend" aria-label="Crowd level legend">
        {(['low','moderate','high','critical'] as CrowdLevel[]).map(l => (
          <span key={l} className="csc-legend-item" title={levelConfig[l].label}>
            <span className={`crowd-dot crowd-dot-${l}`} aria-hidden="true" />
            <span className="csc-legend-text">{levelConfig[l].label.split(' ')[0]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
