import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import AlertCard from '../../components/alerts/AlertCard';
import { getStations } from '../../services/stationService';
import { getAllCurrentObservations } from '../../services/crowdService';
import { getAllAlerts } from '../../services/alertService';
import { getAllReports } from '../../services/reportService';
import '../pages.css';

export default function AdminOverviewPage() {
  const stations = getStations();
  const observations = getAllCurrentObservations();
  const [alerts, setAlerts] = useState(getAllAlerts());
  const reports = getAllReports();

  const handleAlertAction = (id: string, action: 'acknowledge' | 'resolve') => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: action === 'acknowledge' ? 'acknowledged' : 'resolved'
        };
      }
      return a;
    }));
  };

  const totalCommuters = observations.reduce((acc, curr) => acc + (curr.personCount || 0), 0);
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = observations.filter(o => o.crowdLevel === 'critical' || o.crowdLevel === 'high').length;

  return (
    <DashboardLayout
      title="Station Operations & AI Dispatch Command"
      subtitle="Network-wide surveillance, automated crowd anomaly detection, and passenger flow management."
      actions={
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/video-monitoring" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Live CCTV Feeds
          </Link>
          <Link to="/admin/alerts" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Alerts & Incidents ({activeAlertsCount})
          </Link>
        </div>
      }
    >
      {/* ── High-Level Metric Tiles ── */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span>NETWORK COMMUTERS</span>
            <span className="badge badge-low">Live</span>
          </div>
          <div className="metric-value">
            {totalCommuters.toLocaleString()} <span className="metric-unit">People</span>
          </div>
          <div className="metric-footer">
            <span className="metric-trend-up">▲ +4.2%</span> vs last hour
          </div>
        </div>

        <div className="metric-card alert-variant">
          <div className="metric-header">
            <span>CONGESTION ALERTS</span>
            <span className={`badge ${activeAlertsCount > 0 ? 'badge-critical' : 'badge-low'}`}>
              {activeAlertsCount} Active
            </span>
          </div>
          <div className="metric-value">
            {criticalCount} <span className="metric-unit">Crowded Hubs</span>
          </div>
          <div className="metric-footer">
            <span>Rajiv Chowk & Kashmere Gate exceed 80% threshold</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>SURVEILLANCE CAMERAS</span>
            <span className="badge badge-low">Online</span>
          </div>
          <div className="metric-value">
            48 / 48 <span className="metric-unit">Feeds</span>
          </div>
          <div className="metric-footer">
            <span className="metric-trend-down">● 0 camera failures</span> (1080p 30fps)
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>AI PIPELINE INFERENCE</span>
            <span className="badge badge-low">YOLOv8</span>
          </div>
          <div className="metric-value">
            18.4 <span className="metric-unit">ms / frame</span>
          </div>
          <div className="metric-footer">
            <span>Edge inference active on NVIDIA Jetson Xavier</span>
          </div>
        </div>
      </div>

      {/* ── Main Operations Row: Network Heatmap & Active Alerts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.75rem', marginBottom: '2rem' }}>
        {/* Left: Station Network Crowd Matrix */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Station Platform Occupancy Matrix
            </div>
            <Link to="/admin/analytics" style={{ fontSize: '0.85rem', color: 'var(--color-cyan-400)', textDecoration: 'none', fontWeight: 600 }}>
              Deep Analytics →
            </Link>
          </div>

          <div className="table-responsive">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Platform</th>
                  <th>Occupancy</th>
                  <th>Density Bar</th>
                  <th>Camera</th>
                </tr>
              </thead>
              <tbody>
                {observations.map(obs => {
                  const stn = stations.find(s => s.id === obs.stationId);
                  const plt = stn?.platforms.find(p => p.id === obs.platformId);
                  const count = obs.personCount || 0;
                  const pct = Math.min(100, Math.round((count / 400) * 100));

                  return (
                    <tr key={obs.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{stn?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stn?.lineNames.join(', ')}</div>
                      </td>
                      <td>{plt?.name || 'Platform 1'}</td>
                      <td>
                        <span className={`badge badge-${obs.crowdLevel}`}>
                          {obs.crowdLevel} ({count})
                        </span>
                      </td>
                      <td style={{ minWidth: '110px' }}>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: obs.crowdLevel === 'critical' ? '#ef4444' : obs.crowdLevel === 'high' ? '#f97316' : obs.crowdLevel === 'moderate' ? '#eab308' : '#22c55e'
                          }} />
                        </div>
                      </td>
                      <td>
                        <Link
                          to="/admin/video-monitoring"
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--color-cyan-400)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            padding: '3px 8px',
                            background: 'rgba(6, 182, 212, 0.1)',
                            borderRadius: '4px',
                            border: '1px solid rgba(6, 182, 212, 0.2)'
                          }}
                        >
                          CCTV Feed
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Active Anomaly Alerts with Actions */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Active Incidents
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {alerts.filter(a => a.status !== 'resolved').slice(0, 4).map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                showActions={true}
                onAction={handleAlertAction}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Commuter Reports Dispatch Feed ── */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan-400)" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Recent Crowdsourced Passenger Reports
          </div>
          <Link to="/admin/alerts" style={{ fontSize: '0.85rem', color: 'var(--color-cyan-400)', textDecoration: 'none', fontWeight: 600 }}>
            Manage All Reports ({reports.length}) →
          </Link>
        </div>

        <div className="table-responsive">
          <table className="mp-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Station</th>
                <th>Platform</th>
                <th>Issue Category</th>
                <th>Reported Time</th>
                <th>Dispatch Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 5).map(rpt => (
                <tr key={rpt.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rpt.id}</td>
                  <td style={{ fontWeight: 600 }}>{rpt.stationName}</td>
                  <td>{rpt.platformName}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {rpt.reportType.replace('_', ' ')}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(rpt.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className={`badge badge-${rpt.status === 'new' ? 'critical' : rpt.status === 'reviewed' ? 'moderate' : 'low'}`}>
                      {rpt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
