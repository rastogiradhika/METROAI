import { useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import CrowdPredictionCard from '../../components/crowd/CrowdPredictionCard';
import { getStations } from '../../services/stationService';
import { getPrediction, getAllPredictions } from '../../services/predictionService';
import '../pages.css';

export default function PredictionsPage() {
  const stations = getStations();
  const allPredictions = getAllPredictions();

  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || '');
  const [selectedPlatformId, setSelectedPlatformId] = useState(stations[0]?.platforms[0]?.id || '');

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];
  const currentPlatform = selectedStation.platforms.find(p => p.id === selectedPlatformId) || selectedStation.platforms[0];

  const handleStationChange = (id: string) => {
    setSelectedStationId(id);
    const stn = stations.find(s => s.id === id);
    if (stn && stn.platforms.length > 0) {
      setSelectedPlatformId(stn.platforms[0].id);
    }
  };

  // 10-min and 15-min predictions
  const pred10 = getPrediction(selectedStation.id, currentPlatform.id, 10);
  const pred15 = getPrediction(selectedStation.id, currentPlatform.id, 15);

  return (
    <DashboardLayout
      title="15-Minute AI Crowd Predictions"
      subtitle="Anticipate platform bottlenecks and train crowding before you arrive at the turnstiles."
    >
      {/* ── Selection Control ── */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
              STATION
            </label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={selectedStation.id}
              onChange={e => handleStationChange(e.target.value)}
            >
              {stations.map(stn => (
                <option key={stn.id} value={stn.id}>
                  {stn.name} ({stn.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
              PLATFORM / DIRECTION
            </label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={currentPlatform.id}
              onChange={e => setSelectedPlatformId(e.target.value)}
            >
              {selectedStation.platforms.map(plt => (
                <option key={plt.id} value={plt.id}>
                  {plt.name} {plt.direction ? `(${plt.direction})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6, 182, 212, 0.1)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-cyan-300)', fontWeight: 600 }}>AI Inference: Online (YOLOv8 + Graph-LSTM)</span>
        </div>
      </div>

      {/* ── AI Forecast Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {pred10 ? (
          <CrowdPredictionCard
            stationName={selectedStation.name}
            platformName={currentPlatform.name}
            horizon={10}
            predictedLevel={pred10.predictedLevel}
            predictedCount={pred10.predictedCount}
            status={pred10.status}
            forecastAt={pred10.forecastAt}
          />
        ) : (
          <div className="panel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', color: 'var(--text-muted)' }}>
            10-min prediction data unavailable for this platform
          </div>
        )}

        {pred15 ? (
          <CrowdPredictionCard
            stationName={selectedStation.name}
            platformName={currentPlatform.name}
            horizon={15}
            predictedLevel={pred15.predictedLevel}
            predictedCount={pred15.predictedCount}
            status={pred15.status}
            forecastAt={pred15.forecastAt}
          />
        ) : (
          <div className="panel-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', color: 'var(--text-muted)' }}>
            15-min prediction data unavailable for this platform
          </div>
        )}
      </div>

      {/* ── Smart Departure Recommendation ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.08))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          background: 'rgba(6, 182, 212, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-cyan-400)',
          flexShrink: 0
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>
            Optimal Commute Window
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Our model predicts platform occupancy will stabilize in <strong>12 to 15 minutes</strong> following the departure of the upcoming northbound express. Boarding during this window gives you an estimated <strong>65% higher probability of seating</strong>.
          </p>
        </div>
      </div>

      {/* ── Network-wide 15-Min Predictions Grid ── */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            Network-Wide 15-Minute Forecast Radar
          </div>
        </div>

        <div className="table-responsive">
          <table className="mp-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Platform</th>
                <th>Horizon</th>
                <th>Predicted Crowd</th>
                <th>Estimated Count</th>
                <th>Model Confidence</th>
              </tr>
            </thead>
            <tbody>
              {allPredictions.filter(p => p.horizonMinutes === 15).map(pred => {
                const stn = stations.find(s => s.id === pred.stationId);
                const plt = stn?.platforms.find(p => p.id === pred.platformId);
                return (
                  <tr key={pred.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{stn?.name || pred.stationId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stn?.code}</div>
                    </td>
                    <td>{plt?.name || 'Platform 1'}</td>
                    <td>+15 Mins</td>
                    <td>
                      <span className={`badge badge-${pred.predictedLevel}`}>
                        {pred.predictedLevel}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {pred.predictedCount ? `~${pred.predictedCount} commuters` : 'Estimating...'}
                    </td>
                    <td>
                      <span className="badge badge-low">
                        High (95.1%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
