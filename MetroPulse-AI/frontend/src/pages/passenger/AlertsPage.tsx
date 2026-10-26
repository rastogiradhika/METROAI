import { useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import AlertCard from '../../components/alerts/AlertCard';
import { getStations } from '../../services/stationService';
import { getPassengerAlerts } from '../../services/alertService';
import { submitReport } from '../../services/reportService';
import type { ReportType } from '../../types/alert';
import '../pages.css';

export default function AlertsPage() {
  const stations = getStations();
  const alerts = getPassengerAlerts();

  const [selectedStationFilter, setSelectedStationFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Report Form state
  const [reportStationId, setReportStationId] = useState(stations[0]?.id || '');
  const [reportPlatformId, setReportPlatformId] = useState(stations[0]?.platforms[0]?.id || '');
  const [reportType, setReportType] = useState<ReportType>('high_crowd');
  const [reportSuccess, setReportSuccess] = useState(false);

  const selectedReportStation = stations.find(s => s.id === reportStationId);

  const handleStationChange = (id: string) => {
    setReportStationId(id);
    const stn = stations.find(s => s.id === id);
    if (stn && stn.platforms.length > 0) {
      setReportPlatformId(stn.platforms[0].id);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportStation) return;
    const plt = selectedReportStation.platforms.find(p => p.id === reportPlatformId);
    submitReport(
      selectedReportStation.id,
      reportPlatformId,
      selectedReportStation.name,
      plt?.name || 'Platform 1',
      reportType
    );
    setReportSuccess(true);
    setTimeout(() => setReportSuccess(false), 3000);
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesStation = selectedStationFilter === 'all' || alert.stationId === selectedStationFilter;
    const matchesUrgency = urgencyFilter === 'all' || alert.type === urgencyFilter;
    return matchesStation && matchesUrgency;
  });

  return (
    <DashboardLayout
      title="Commuter Alerts & Advisories"
      subtitle="Real-time safety notifications, station congestion alerts, and crowdsourced passenger updates."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Alerts Feed & Filters */}
        <div>
          {/* Filter Bar */}
          <div className="toolbar-bar">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
              <div>
                <select
                  className="filter-select"
                  value={selectedStationFilter}
                  onChange={e => setSelectedStationFilter(e.target.value)}
                >
                  <option value="all">All Stations</option>
                  {stations.map(stn => (
                    <option key={stn.id} value={stn.id}>
                      {stn.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className="filter-select"
                  value={urgencyFilter}
                  onChange={e => setUrgencyFilter(e.target.value)}
                >
                  <option value="all">All Alert Severities</option>
                  <option value="crowd_critical">Critical Congestion</option>
                  <option value="crowd_high">High Crowd Warning</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {filteredAlerts.length} advisories
            </div>
          </div>

          {/* Alerts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))
            ) : (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ margin: '0 auto 0.75rem' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  No Active Advisories
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  All selected metro lines and stations are operating within standard crowd limits.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Direct Crowdsourced Report Form */}
        <div className="panel-card" style={{ position: 'sticky', top: '1rem' }}>
          <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
            <div className="panel-title" style={{ fontSize: '1.05rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan-400)" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Report Overcrowding
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Help fellow commuters by alerting them to real-time train or platform bottlenecks.
          </p>

          {reportSuccess ? (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              color: '#4ade80',
              textAlign: 'center',
              fontSize: '0.875rem'
            }}>
              ✓ Thank you! Your report has been dispatched to station management.
            </div>
          ) : (
            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Station
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={reportStationId}
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Platform
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={reportPlatformId}
                  onChange={e => setReportPlatformId(e.target.value)}
                >
                  {selectedReportStation?.platforms.map(plt => (
                    <option key={plt.id} value={plt.id}>
                      {plt.name} {plt.direction ? `(${plt.direction})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Incident Description
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={reportType}
                  onChange={e => setReportType(e.target.value as ReportType)}
                >
                  <option value="high_crowd">High Commuter Rush</option>
                  <option value="overcrowding">Severe Overcrowding (Boarding blocked)</option>
                  <option value="safety_concern">Escalator / Staircase Chokepoint</option>
                  <option value="other">General Operational Delay</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Broadcast Live Report
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
