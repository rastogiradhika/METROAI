import { useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getStations } from '../../services/stationService';
import { getAllCurrentObservations } from '../../services/crowdService';
import '../pages.css';

interface CameraFeed {
  id: string;
  name: string;
  stationId: string;
  stationName: string;
  platformName: string;
  camCode: string;
  fps: number;
  resolution: string;
  activePersons: number;
  status: 'critical' | 'high' | 'moderate' | 'low';
}

export default function VideoMonitoringPage() {
  const stations = getStations();
  const observations = getAllCurrentObservations();

  const [selectedStationFilter, setSelectedStationFilter] = useState('all');
  const [activeCamModal, setActiveCamModal] = useState<CameraFeed | null>(null);
  const [threshold, setThreshold] = useState(250);
  const [alertDispatched, setAlertDispatched] = useState(false);

  // Generate simulated camera feeds from observations
  const cameraFeeds: CameraFeed[] = observations.map((obs, idx) => {
    const stn = stations.find(s => s.id === obs.stationId);
    const plt = stn?.platforms.find(p => p.id === obs.platformId);
    return {
      id: `cam-${idx + 1}`,
      name: `CCTV-${idx + 1 < 10 ? '0' : ''}${idx + 1}`,
      stationId: obs.stationId,
      stationName: stn?.name || 'Station',
      platformName: plt?.name || 'Platform 1',
      camCode: `CAM-${stn?.code || 'DEL'}-0${idx + 1}`,
      fps: 29.97,
      resolution: '1920x1080',
      activePersons: obs.personCount || 120,
      status: obs.crowdLevel === 'unavailable' ? 'low' : obs.crowdLevel
    };
  });

  const filteredCams = selectedStationFilter === 'all'
    ? cameraFeeds
    : cameraFeeds.filter(c => c.stationId === selectedStationFilter);

  const handleManualDispatch = () => {
    setAlertDispatched(true);
    setTimeout(() => setAlertDispatched(false), 2500);
  };

  return (
    <DashboardLayout
      title="Live Video Surveillance & AI Detection"
      subtitle="Edge-accelerated YOLOv8 object detection feeds with real-time bounding box density analysis."
    >
      {/* ── Toolbar ── */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <select
              className="filter-select"
              value={selectedStationFilter}
              onChange={e => setSelectedStationFilter(e.target.value)}
            >
              <option value="all">All Camera Feeds ({cameraFeeds.length})</option>
              {stations.map(stn => (
                <option key={stn.id} value={stn.id}>
                  {stn.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span>AI Stream Processor: <strong>Active (TensorRT 8.6)</strong></span>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {filteredCams.length} Live Feeds
        </div>
      </div>

      {/* ── CCTV Camera Feeds Grid ── */}
      <div className="cctv-grid">
        {filteredCams.map((cam) => (
          <div key={cam.id} className="cctv-box">
            {/* The Screen / Simulated Video */}
            <div className="cctv-screen">
              <div className="cctv-screen-scanline" />

              {/* HUD Header */}
              <div className="cctv-hud-header">
                <span className="cctv-live-tag">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  LIVE
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                  {cam.camCode}
                </span>
              </div>

              {/* Simulated AI Detection Bounding Boxes */}
              <div className="detection-box" style={{ width: '38px', height: '82px', top: '28%', left: '22%' }}>
                <span className="detection-box-label">p:0.96</span>
              </div>
              <div className="detection-box" style={{ width: '34px', height: '78px', top: '32%', left: '38%' }}>
                <span className="detection-box-label">p:0.93</span>
              </div>
              <div className="detection-box" style={{ width: '42px', height: '88px', top: '24%', left: '54%' }}>
                <span className="detection-box-label">p:0.98</span>
              </div>
              <div className="detection-box" style={{ width: '36px', height: '80px', top: '35%', left: '72%' }}>
                <span className="detection-box-label">p:0.89</span>
              </div>

              {/* Station Watermark */}
              <div style={{
                position: 'absolute',
                color: 'rgba(255, 255, 255, 0.25)',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                pointerEvents: 'none'
              }}>
                {cam.stationName}
              </div>

              {/* HUD Footer Stats */}
              <div className="cctv-hud-stats">
                <span>YOLOv8: {cam.activePersons} persons</span>
                <span>{cam.fps} FPS</span>
              </div>
            </div>

            {/* Camera Box Footer */}
            <div className="cctv-footer">
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {cam.stationName} — {cam.platformName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {cam.resolution} • Edge Node #0{cam.id.split('-')[1]}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge badge-${cam.status}`}>
                  {cam.status}
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                  onClick={() => setActiveCamModal(cam)}
                >
                  Inspect
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Camera Inspect / Controls Modal ── */}
      {activeCamModal && (
        <div className="mp-modal-backdrop" onClick={() => setActiveCamModal(null)}>
          <div className="mp-modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setActiveCamModal(null)} aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Feed Analysis: {activeCamModal.camCode}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {activeCamModal.stationName} • {activeCamModal.platformName} • Neural Stream Pipeline
            </p>

            {/* Video preview in modal */}
            <div className="cctv-screen" style={{ height: '220px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div className="cctv-screen-scanline" />
              <div className="cctv-hud-header">
                <span className="cctv-live-tag">LIVE FEED</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  BUFFER: 0.12s
                </span>
              </div>
              <div className="detection-box" style={{ width: '48px', height: '98px', top: '22%', left: '30%' }}>
                <span className="detection-box-label">person: 0.97</span>
              </div>
              <div className="detection-box" style={{ width: '44px', height: '94px', top: '28%', left: '55%' }}>
                <span className="detection-box-label">person: 0.94</span>
              </div>
              <div className="cctv-hud-stats">
                <span>Current Detection: {activeCamModal.activePersons} commuters</span>
                <span>Latency: 16.2ms</span>
              </div>
            </div>

            {/* Alert Dispatch Notice */}
            {alertDispatched && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                color: '#4ade80',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                ✓ Quick Response Team (QRT) dispatched to {activeCamModal.platformName}!
              </div>
            )}

            {/* Control Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Automated Congestion Threshold</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-cyan-400)' }}>{threshold} commuters</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="500"
                  value={threshold}
                  onChange={e => setThreshold(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-cyan-400)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => alert(`CCTV Snapshot for ${activeCamModal.camCode} saved to server archive.`)}
                >
                  Capture Snapshot
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleManualDispatch}
                >
                  Dispatch Station Marshals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
