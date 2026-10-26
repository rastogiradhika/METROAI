import { useState, useMemo } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import CrowdStatusCard from '../../components/crowd/CrowdStatusCard';
import CrowdTrendChart from '../../components/crowd/CrowdTrendChart';
import { getStations } from '../../services/stationService';
import { getObservationsByStation, getObservationsByPlatform, getCrowdTrend } from '../../services/crowdService';
import '../pages.css';

export default function CrowdStatusPage() {
  const stations = getStations();

  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || '');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlatformId, setActivePlatformId] = useState<string>('');

  // Filter stations based on selected line and search
  const filteredStations = useMemo(() => {
    return stations.filter(stn => {
      const matchesLine = selectedLine === 'all' || stn.lineNames.includes(selectedLine);
      const matchesSearch = stn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            stn.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLine && matchesSearch;
    });
  }, [stations, selectedLine, searchQuery]);

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];

  // Set default platform if active platform doesn't belong to current station
  const currentPlatformId = useMemo(() => {
    if (!selectedStation) return '';
    const exists = selectedStation.platforms.some(p => p.id === activePlatformId);
    return exists ? activePlatformId : selectedStation.platforms[0]?.id || '';
  }, [selectedStation, activePlatformId]);

  const platformObservation = getObservationsByPlatform(selectedStation.id, currentPlatformId);
  const stationObservations = getObservationsByStation(selectedStation.id);
  const trendData = getCrowdTrend(selectedStation.id, currentPlatformId);
  const currentPlatform = selectedStation.platforms.find(p => p.id === currentPlatformId);

  return (
    <DashboardLayout
      title="Live Station Crowd Density"
      subtitle="Real-time occupancy levels, platform density heatmaps, and historical commuter trends."
    >
      {/* ── Filter Bar ── */}
      <div className="toolbar-bar">
        <div className="search-box-wrapper">
          <svg className="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-box-input"
            placeholder="Search station or code (e.g. RJC, Kashmere)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chip-filters">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px' }}>Filter Line:</span>
          {['all', 'Yellow Line', 'Blue Line', 'Violet Line', 'Red Line'].map(line => (
            <button
              key={line}
              className={`chip-btn ${selectedLine === line ? 'active' : ''}`}
              onClick={() => setSelectedLine(line)}
            >
              {line === 'all' ? 'All Lines' : line}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Station Content Area ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Station Selector List */}
        <div className="panel-card" style={{ padding: '1rem' }}>
          <div style={{ padding: '0.5rem 0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Stations ({filteredStations.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '560px', overflowY: 'auto' }}>
            {filteredStations.map(stn => {
              const obsList = getObservationsByStation(stn.id);
              const maxCrowd = obsList[0]?.crowdLevel || 'low';
              const isSelected = stn.id === selectedStation.id;

              return (
                <button
                  key={stn.id}
                  onClick={() => setSelectedStationId(stn.id)}
                  style={{
                    background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--color-cyan-500)' : 'transparent'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--color-cyan-300)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {stn.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {stn.lineNames.join(' • ')}
                    </div>
                  </div>
                  <span className={`badge badge-${maxCrowd}`} style={{ fontSize: '0.7rem' }}>
                    {maxCrowd}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Station Details & Trend Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Station Platform Selection Tabs */}
          <div className="panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedStation.name}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Station Code: <strong style={{ color: 'var(--color-cyan-400)' }}>{selectedStation.code}</strong> • Lines: {selectedStation.lineNames.join(', ')}
                </div>
              </div>

              {/* Platform Switcher */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-navy-950)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                {selectedStation.platforms.map(plt => (
                  <button
                    key={plt.id}
                    onClick={() => setActivePlatformId(plt.id)}
                    style={{
                      background: currentPlatformId === plt.id ? 'var(--color-cyan-500)' : 'transparent',
                      color: currentPlatformId === plt.id ? '#000' : 'var(--text-secondary)',
                      fontWeight: currentPlatformId === plt.id ? 700 : 500,
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {plt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Single Platform Live Card */}
            {platformObservation ? (
              <CrowdStatusCard
                stationName={selectedStation.name}
                platformName={`${currentPlatform?.name || 'Platform 1'} (${currentPlatform?.direction || 'Direct Line'})`}
                crowdLevel={platformObservation.crowdLevel}
                personCount={platformObservation.personCount}
                observedAt={platformObservation.observedAt}
              />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Live sensor feed initializing for this platform...
              </div>
            )}
          </div>

          {/* Interactive Crowd Trend Chart */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Crowd Density Trend Over Time (24h Observed & Predicted)
              </div>
            </div>

            <CrowdTrendChart
              data={trendData}
              title={`${selectedStation.name} — ${currentPlatform?.name || 'Platform 1'}`}
            />
          </div>

          {/* All Station Platforms Overview */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                All Platforms at {selectedStation.name}
              </div>
            </div>

            <div className="cards-grid">
              {stationObservations.map(obs => {
                const plt = selectedStation.platforms.find(p => p.id === obs.platformId);
                return (
                  <CrowdStatusCard
                    key={obs.id}
                    stationName={selectedStation.name}
                    platformName={plt ? `${plt.name} (${plt.direction})` : 'Platform'}
                    crowdLevel={obs.crowdLevel}
                    personCount={obs.personCount}
                    observedAt={obs.observedAt}
                    showTimestamp={false}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
