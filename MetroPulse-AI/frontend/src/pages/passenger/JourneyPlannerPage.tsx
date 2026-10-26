import { useState, useMemo } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getStations, findRoute } from '../../services/stationService';
import { getAllCurrentObservations } from '../../services/crowdService';
import type { CrowdLevel } from '../../types/crowd';
import '../pages.css';

export default function JourneyPlannerPage() {
  const stations = getStations();
  const observations = getAllCurrentObservations();

  const [sourceId, setSourceId] = useState(stations[0]?.id || '');
  const [destId, setDestId] = useState(stations[2]?.id || '');

  const swapStations = () => {
    setSourceId(destId);
    setDestId(sourceId);
  };

  const route = useMemo(() => {
    if (!sourceId || !destId || sourceId === destId) return null;
    return findRoute(sourceId, destId);
  }, [sourceId, destId]);

  // Helper to get crowd level for a station stop
  const getStopCrowd = (stationId: string): CrowdLevel => {
    const obs = observations.find(o => o.stationId === stationId);
    return obs?.crowdLevel || 'low';
  };

  return (
    <DashboardLayout
      title="Smart Journey Planner"
      subtitle="Find optimal metro routes with real-time crowd insights and interchange congestion forecasts."
    >
      {/* ── Journey Config Card ── */}
      <div className="panel-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
          Select Origin & Destination
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1rem',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              From (Origin Station)
            </label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
            >
              {stations.map(stn => (
                <option key={stn.id} value={stn.id} disabled={stn.id === destId}>
                  {stn.name} ({stn.code})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={swapStations}
            title="Swap Origin and Destination"
            style={{ padding: '0.55rem 0.85rem', marginBottom: '2px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
            </svg>
          </button>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              To (Destination Station)
            </label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={destId}
              onChange={e => setDestId(e.target.value)}
            >
              {stations.map(stn => (
                <option key={stn.id} value={stn.id} disabled={stn.id === sourceId}>
                  {stn.name} ({stn.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Route Result ── */}
      {sourceId === destId ? (
        <div style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-secondary)'
        }}>
          Please select two different stations to calculate journey itinerary and crowd forecast.
        </div>
      ) : route ? (
        <div>
          {/* ── Route Overview Highlights ── */}
          <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="metric-card">
              <div className="metric-header">
                <span>ESTIMATED DURATION</span>
              </div>
              <div className="metric-value">
                {route.estimatedDurationMinutes ?? (route.totalStops * 2.5)} <span className="metric-unit">Minutes</span>
              </div>
              <div className="metric-footer">
                <span>Average transit frequency: 3 mins</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>TOTAL STOPS</span>
              </div>
              <div className="metric-value">
                {route.stationSequence.length} <span className="metric-unit">Stations</span>
              </div>
              <div className="metric-footer">
                <span>Lines: {route.lineNames.join(', ')}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>INTERCHANGES</span>
              </div>
              <div className="metric-value">
                {route.interchanges.length} <span className="metric-unit">Change(s)</span>
              </div>
              <div className="metric-footer">
                <span>{route.interchanges.length === 0 ? 'Direct Route' : 'Requires line change'}</span>
              </div>
            </div>
          </div>

          {/* ── AI Recommendation Callout ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(20, 184, 166, 0.08))',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <div style={{
              background: 'var(--color-cyan-500)',
              color: '#000',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-cyan-300)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                MetroPulse AI Commuter Recommendation
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Current route congestion is moderate. If you depart in <strong>15 minutes</strong>, peak crowd levels at transfer hub <strong>Rajiv Chowk</strong> are predicted to decrease by <strong>~22%</strong> due to incoming rapid dispatches.
              </p>
            </div>
          </div>

          {/* ── Stop by Stop Itinerary ── */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Detailed Route Stops & Real-Time Density
              </div>
            </div>

            <div className="journey-timeline">
              {route.stationSequence.map((stop, idx) => {
                const isStart = idx === 0;
                const isEnd = idx === route.stationSequence.length - 1;
                const crowd = getStopCrowd(stop.stationId);

                return (
                  <div key={`${stop.stationId}-${idx}`} className="journey-stop-item">
                    <div className="journey-track-line" />
                    <div className={`journey-dot ${stop.isInterchange ? 'interchange' : ''}`}>
                      {isStart ? 'A' : isEnd ? 'B' : idx + 1}
                    </div>

                    <div className="journey-stop-details">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                            {stop.stationName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({stop.stationCode})
                          </span>
                          {stop.isInterchange && (
                            <span className="badge badge-line" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                              Interchange Hub
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Line: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{stop.lineName}</span>
                          {isStart && ' • Departure Station'}
                          {isEnd && ' • Destination'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Crowd Level:</span>
                        <span className={`badge badge-${crowd}`}>
                          {crowd}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Direct Route Not Cached</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            A standard route schedule between these stations is being fetched or requires an additional feeder connection.
          </p>
          <button className="btn btn-secondary" onClick={() => { setSourceId(stations[0].id); setDestId(stations[2].id); }}>
            Reset to Rajiv Chowk → Central Secretariat
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
