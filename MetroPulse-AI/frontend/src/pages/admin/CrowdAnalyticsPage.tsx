import { useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import CrowdTrendChart from '../../components/crowd/CrowdTrendChart';
import { getStations } from '../../services/stationService';
import { getCrowdTrend } from '../../services/crowdService';
import '../pages.css';

export default function CrowdAnalyticsPage() {
  const stations = getStations();

  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || '');
  const [selectedPlatformId, setSelectedPlatformId] = useState(stations[0]?.platforms[0]?.id || '');
  const [timeRange, setTimeRange] = useState('today');
  const [exported, setExported] = useState(false);

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];
  const currentPlatform = selectedStation.platforms.find(p => p.id === selectedPlatformId) || selectedStation.platforms[0];

  const handleStationChange = (id: string) => {
    setSelectedStationId(id);
    const stn = stations.find(s => s.id === id);
    if (stn && stn.platforms.length > 0) {
      setSelectedPlatformId(stn.platforms[0].id);
    }
  };

  const trendData = getCrowdTrend(selectedStation.id, currentPlatform.id);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <DashboardLayout
      title="Network Crowd Analytics & AI Performance"
      subtitle="Historical passenger volume analysis, peak congestion curves, and 15-min prediction validation."
      actions={
        <button
          className="btn btn-secondary"
          onClick={handleExport}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exported ? 'Report Downloaded!' : 'Export CSV Dataset'}
        </button>
      }
    >
      {/* ── Filter Bar ── */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
              STATION
            </label>
            <select
              className="filter-select"
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

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
              PLATFORM
            </label>
            <select
              className="filter-select"
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

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
              TIMEFRAME
            </label>
            <select
              className="filter-select"
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
            >
              <option value="today">Today (Real-Time Ingestion)</option>
              <option value="yesterday">Yesterday (Completed Cycle)</option>
              <option value="7days">Past 7 Days (Moving Average)</option>
              <option value="30days">Last 30 Days (Full Month)</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Aggregated over <strong>24 hourly intervals</strong>
        </div>
      </div>

      {/* ── Analytics KPI Cards ── */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span>PEAK HOUR SURGE</span>
            <span className="badge badge-high">08:30 - 09:30 AM</span>
          </div>
          <div className="metric-value">
            412 <span className="metric-unit">Peak Turnstiles/min</span>
          </div>
          <div className="metric-footer">
            <span>Evening peak at 18:15 PM (~380/min)</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>DAILY STATION VOLUME</span>
            <span className="badge badge-low">Ingested</span>
          </div>
          <div className="metric-value">
            142.8k <span className="metric-unit">Commuters</span>
          </div>
          <div className="metric-footer">
            <span className="metric-trend-up">▲ 6.1%</span> increase vs previous Monday
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>PREDICTION ACCURACY (MAE)</span>
            <span className="badge badge-low">Validated</span>
          </div>
          <div className="metric-value">
            94.6 <span className="metric-unit">% Mean Score</span>
          </div>
          <div className="metric-footer">
            <span className="metric-trend-down">● ±4.2 persons</span> variance over 15m
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>AVG PLATFORM DWELL TIME</span>
            <span className="badge badge-moderate">Target: &lt;3m</span>
          </div>
          <div className="metric-value">
            2.7 <span className="metric-unit">Minutes</span>
          </div>
          <div className="metric-footer">
            <span>Train headway: 2m 45s</span>
          </div>
        </div>
      </div>

      {/* ── Main Chart ── */}
      <div className="panel-card" style={{ marginBottom: '2rem' }}>
        <div className="panel-header">
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            24-Hour Passenger Traffic: Observed vs. 15-Min Prediction Curve
          </div>
        </div>

        <CrowdTrendChart
          data={trendData}
          title={`${selectedStation.name} — ${currentPlatform.name} Traffic Dynamics`}
        />
      </div>

      {/* ── Network Line Performance Benchmark ── */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            Line Density & Capacity Utilization Matrix
          </div>
        </div>

        <div className="table-responsive">
          <table className="mp-table">
            <thead>
              <tr>
                <th>Metro Line</th>
                <th>Major Terminus</th>
                <th>Average Platform Utilization</th>
                <th>Active Trains</th>
                <th>15-Min Overcrowding Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong style={{ color: '#eab308' }}>Yellow Line</strong> (Samaypur Badli ↔ Millennium City)</td>
                <td>Rajiv Chowk / Kashmere Gate</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '84%', height: '100%', background: '#f97316' }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>84%</span>
                  </div>
                </td>
                <td>34 Trains</td>
                <td><span className="badge badge-high">High Risk</span></td>
              </tr>
              <tr>
                <td><strong style={{ color: '#3b82f6' }}>Blue Line</strong> (Dwarka Sector 21 ↔ Noida Electronic City)</td>
                <td>Rajiv Chowk / Mandi House</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '72%', height: '100%', background: '#eab308' }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>72%</span>
                  </div>
                </td>
                <td>28 Trains</td>
                <td><span className="badge badge-moderate">Moderate</span></td>
              </tr>
              <tr>
                <td><strong style={{ color: '#8b5cf6' }}>Violet Line</strong> (Kashmere Gate ↔ Raja Nahar Singh)</td>
                <td>Central Secretariat / Kashmere Gate</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '58%', height: '100%', background: '#22c55e' }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>58%</span>
                  </div>
                </td>
                <td>22 Trains</td>
                <td><span className="badge badge-low">Low</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
