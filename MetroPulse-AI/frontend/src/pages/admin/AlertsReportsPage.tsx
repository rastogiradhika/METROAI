import { useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import AlertCard from '../../components/alerts/AlertCard';
import { getStations } from '../../services/stationService';
import { getAllAlerts } from '../../services/alertService';
import { getAllReports, updateReportStatus } from '../../services/reportService';
import type { CrowdAlert, ReportStatus, AlertType } from '../../types/alert';
import '../pages.css';

export default function AlertsReportsPage() {
  const stations = getStations();

  const [activeTab, setActiveTab] = useState<'alerts' | 'reports'>('alerts');
  const [alerts, setAlerts] = useState<CrowdAlert[]>(getAllAlerts());
  const [reports, setReports] = useState(getAllReports());

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');

  // New Alert Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStationId, setNewStationId] = useState(stations[0]?.id || '');
  const [newPlatformId, setNewPlatformId] = useState(stations[0]?.platforms[0]?.id || '');
  const [newType, setNewType] = useState<AlertType>('crowd_high');
  const [newMessage, setNewMessage] = useState('');

  const selectedNewStation = stations.find(s => s.id === newStationId);

  const handleStationModalChange = (id: string) => {
    setNewStationId(id);
    const stn = stations.find(s => s.id === id);
    if (stn && stn.platforms.length > 0) {
      setNewPlatformId(stn.platforms[0].id);
    }
  };

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

  const handleReportStatusChange = (reportId: string, newStatus: ReportStatus) => {
    updateReportStatus(reportId, newStatus);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewStation || !newMessage.trim()) return;
    const plt = selectedNewStation.platforms.find(p => p.id === newPlatformId);

    const createdAlert: CrowdAlert = {
      id: `alt-${Date.now()}`,
      stationId: selectedNewStation.id,
      platformId: newPlatformId,
      stationName: selectedNewStation.name,
      platformName: plt?.name || 'Platform 1',
      type: newType,
      message: newMessage,
      createdAt: new Date().toISOString(),
      status: 'active',
      isDemo: true,
    };

    setAlerts([createdAlert, ...alerts]);
    setNewMessage('');
    setShowCreateModal(false);
  };

  // Filtered lists
  const filteredAlerts = alerts.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesStation = stationFilter === 'all' || a.stationId === stationFilter;
    return matchesStatus && matchesStation;
  });

  const filteredReports = reports.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesStation = stationFilter === 'all' || r.stationId === stationFilter;
    return matchesStatus && matchesStation;
  });

  return (
    <DashboardLayout
      title="Alert Operations & Incident Management"
      subtitle="Audit active system warnings, dispatch operator advisories, and triage passenger overcrowding reports."
      actions={
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Broadcast Station Advisory
        </button>
      }
    >
      {/* ── View Switcher Tabs ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            background: activeTab === 'alerts' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'alerts' ? 'var(--color-cyan-300)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'alerts' ? 'var(--color-cyan-400)' : 'transparent'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          System Alerts ({alerts.filter(a => a.status === 'active').length} Active)
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          style={{
            background: activeTab === 'reports' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'reports' ? 'var(--color-cyan-300)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'reports' ? 'var(--color-cyan-400)' : 'transparent'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          Passenger Reports ({reports.length} Total)
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <select
              className="filter-select"
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value)}
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
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {activeTab === 'alerts' ? (
                <>
                  <option value="active">Active</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                </>
              ) : (
                <>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="flagged">Flagged</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {activeTab === 'alerts' ? filteredAlerts.length : filteredReports.length} records
        </div>
      </div>

      {/* ── Tab Content: Alerts ── */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                showActions={true}
                onAction={handleAlertAction}
              />
            ))
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              No system alerts match the selected filters.
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Passenger Reports ── */}
      {activeTab === 'reports' && (
        <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Station & Platform</th>
                  <th>Type</th>
                  <th>Reported At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(rpt => (
                  <tr key={rpt.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {rpt.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rpt.stationName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rpt.platformName}</div>
                    </td>
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
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {rpt.status !== 'reviewed' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => handleReportStatusChange(rpt.id, 'reviewed')}
                          >
                            Mark Reviewed
                          </button>
                        )}
                        {rpt.status !== 'flagged' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#f87171' }}
                            onClick={() => handleReportStatusChange(rpt.id, 'flagged')}
                          >
                            Flag
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Broadcast Station Advisory ── */}
      {showCreateModal && (
        <div className="mp-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="mp-modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)} aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Broadcast Operational Advisory
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              This alert will be broadcast to all passenger dashboards and surveillance consoles immediately.
            </p>

            <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Target Station
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={newStationId}
                  onChange={e => handleStationModalChange(e.target.value)}
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
                  value={newPlatformId}
                  onChange={e => setNewPlatformId(e.target.value)}
                >
                  {selectedNewStation?.platforms.map(plt => (
                    <option key={plt.id} value={plt.id}>
                      {plt.name} {plt.direction ? `(${plt.direction})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Severity Level
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={newType}
                  onChange={e => setNewType(e.target.value as AlertType)}
                >
                  <option value="crowd_high">High Crowd Warning</option>
                  <option value="crowd_critical">Critical Congestion Alert</option>
                  <option value="service_disruption">Service Disruption / Train Delay</option>
                  <option value="system_data">Sensors Maintenance Notice</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Broadcast Message
                </label>
                <textarea
                  className="search-box-input"
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', resize: 'vertical' }}
                  placeholder="e.g. Platform 1 approaching 85% capacity. Commuters advised to queue along Gate 4."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Advisory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
