import type { CrowdLevel, PredictionStatus, PredictionHorizon } from '../../types/crowd';

interface CrowdPredictionCardProps {
  stationName: string;
  platformName?: string;
  horizon: PredictionHorizon;
  predictedLevel: CrowdLevel;
  predictedCount: number | null;
  forecastAt: string;
  status: PredictionStatus;
}

const levelColors: Record<CrowdLevel, string> = {
  low: 'var(--crowd-low)',
  moderate: 'var(--crowd-moderate)',
  high: 'var(--crowd-high)',
  critical: 'var(--crowd-critical)',
  unavailable: 'var(--crowd-unavailable)',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function CrowdPredictionCard({ stationName, platformName, horizon, predictedLevel, predictedCount, forecastAt, status }: CrowdPredictionCardProps) {
  if (status !== 'available') {
    return (
      <div className="prediction-card prediction-unavailable" role="region" aria-label="Crowd prediction unavailable">
        <div className="pred-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          <span>{horizon}-Minute Forecast</span>
        </div>
        <div className="pred-unavailable-body">
          <div className="pred-unavailable-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          </div>
          <p className="pred-unavailable-text">
            {status === 'insufficient_data'
              ? 'Insufficient observation data to generate a forecast for this station.'
              : 'Forecast unavailable for this station and platform.'}
          </p>
          <span className="badge badge-unavailable">{status === 'insufficient_data' ? 'Insufficient Data' : 'Unavailable'}</span>
        </div>
        <p className="pred-disclaimer">Forecasts are illustrative only and are not guaranteed predictions.</p>
      </div>
    );
  }

  return (
    <div className={`prediction-card prediction-${predictedLevel}`} role="region" aria-label={`${horizon}-minute crowd forecast`}>
      <div className="pred-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
        <span>{horizon}-Minute Forecast</span>
        <span className="pred-forecast-time">for {formatTime(forecastAt)}</span>
      </div>

      <div className="pred-body">
        <div className="pred-location">
          <span className="pred-station">{stationName}</span>
          {platformName && <span className="pred-platform">{platformName}</span>}
        </div>

        <div className="pred-level-display" style={{ color: levelColors[predictedLevel] }}>
          <div className="pred-level-dot" style={{ background: levelColors[predictedLevel] }} aria-hidden="true" />
          <span className="pred-level-text">{predictedLevel.toUpperCase()} CROWD</span>
        </div>

        <div className="pred-count">
          {predictedCount !== null
            ? <><span className="pred-count-value">~{predictedCount.toLocaleString()}</span><span className="pred-count-label"> predicted persons</span></>
            : <span className="pred-count-label">Predicted count not available</span>
          }
        </div>
      </div>
      <p className="pred-disclaimer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        DEMO DATA — Illustrative forecast only, not a real prediction.
      </p>
    </div>
  );
}
