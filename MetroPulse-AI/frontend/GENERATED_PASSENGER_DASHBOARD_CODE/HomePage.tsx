import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import CurrentCrowdStatusCard from '../../components/passenger/CurrentCrowdStatusCard';
import CrowdPredictionSection from '../../components/passenger/CrowdPredictionSection';
import StationCrowdReportToggle from '../../components/passenger/StationCrowdReportToggle';
import StationAlertsSection from '../../components/passenger/StationAlertsSection';
import { getStations, getStationById } from '../../services/stationService';
import {
  getObservationsByPlatform,
  getCrowdTrend,
} from '../../services/crowdService';
import { getStationPlatformPredictions } from '../../services/predictionService';
import { getAlertsByStation } from '../../services/alertService';
import '../../components/passenger/PassengerDashboard.css';
import '../pages.css';

// Delhi Metro line color mapping for authentic railway aesthetics
const lineColors: Record<string, string> = {
  'Yellow Line': '#eab308',
  'Blue Line': '#2563eb',
  'Red Line': '#dc2626',
  'Violet Line': '#7c3aed',
  'Magenta Line': '#c026d3',
  'Airport Express': '#f97316',
};

export default function HomePage() {
  const allStations = getStations();

  // Selected station state (default to Rajiv Chowk, but can be cleared to show empty state)
  const [selectedStationId, setSelectedStationId] = useState<string>('stn-001');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('plt-001-Y');

  // Search input & dropdown combobox state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Selected Station details
  const selectedStation = useMemo(() => {
    if (!selectedStationId) return null;
    return getStationById(selectedStationId) || null;
  }, [selectedStationId]);

  // Filter stations for search combobox
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allStations;
    const q = searchQuery.toLowerCase().trim();
    return allStations.filter(
      (stn) =>
        stn.name.toLowerCase().includes(q) ||
        stn.code.toLowerCase().includes(q) ||
        stn.lineNames.some((l) => l.toLowerCase().includes(q))
    );
  }, [allStations, searchQuery]);

  // Verified platforms for the selected station
  const verifiedPlatforms = useMemo(() => {
    return selectedStation?.platforms || [];
  }, [selectedStation]);

  // Handle station selection
  const handleSelectStation = (stnId: string) => {
    setSelectedStationId(stnId);
    setSearchQuery('');
    setIsDropdownOpen(false);
    const stn = allStations.find((s) => s.id === stnId);
    if (stn && stn.platforms.length > 0) {
      setSelectedPlatformId(stn.platforms[0].id);
    } else {
      setSelectedPlatformId('');
    }
  };

  // Clear station selection to display empty state
  const handleClearStation = () => {
    setSelectedStationId('');
    setSelectedPlatformId('');
    setSearchQuery('');
  };

  // Verified platform observation data
  const currentObservation = useMemo(() => {
    if (!selectedStationId || !selectedPlatformId) return undefined;
    return getObservationsByPlatform(selectedStationId, selectedPlatformId);
  }, [selectedStationId, selectedPlatformId]);

  // Verified platform predictions (5, 10, 15 min)
  const currentPredictions = useMemo(() => {
    if (!selectedStationId || !selectedPlatformId) return [];
    return getStationPlatformPredictions(selectedStationId, selectedPlatformId);
  }, [selectedStationId, selectedPlatformId]);

  // Verified platform historical trend
  const currentTrend = useMemo(() => {
    if (!selectedStationId || !selectedPlatformId) return [];
    return getCrowdTrend(selectedStationId, selectedPlatformId);
  }, [selectedStationId, selectedPlatformId]);

  // Verified passenger-facing alerts for selected station
  const stationAlerts = useMemo(() => {
    if (!selectedStationId) return [];
    return getAlertsByStation(selectedStationId);
  }, [selectedStationId]);

  const activePlatform = verifiedPlatforms.find((p) => p.id === selectedPlatformId);

  return (
    <DashboardLayout
      title="Passenger Dashboard"
      subtitle="Real-time Delhi Metro crowd intelligence, 15-minute AI occupancy predictions, and passenger advisories."
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="demo-data-badge" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
            DEMO MODE • LOCAL DATA
          </span>
        </div>
      }
    >
      <div className="passenger-dashboard-container">
        {/* ── Section A: Header and Station Selection ── */}
        <section className="station-search-panel" aria-label="Station Selection Controls">
          <div className="station-search-controls">
            <div className="station-input-group">
              <div className="station-search-combobox">
                <svg
                  className="station-search-icon-left"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                <input
                  type="text"
                  className="station-search-field"
                  placeholder={
                    selectedStation
                      ? `Selected: ${selectedStation.name} (${selectedStation.code}) — Search another station...`
                      : 'Search metro station name, code (e.g. RJC, NDLS), or line...'
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  aria-label="Search and select metro station"
                />

                {(searchQuery || selectedStationId) && (
                  <button
                    type="button"
                    className="station-clear-btn"
                    onClick={handleClearStation}
                    title="Clear station selection to view empty state"
                    aria-label="Clear station selection"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}

                {/* Dropdown Autocomplete Menu */}
                {isDropdownOpen && (
                  <div className="station-dropdown-menu" role="listbox">
                    {searchResults.length > 0 ? (
                      searchResults.map((stn) => (
                        <button
                          key={stn.id}
                          type="button"
                          className={`station-dropdown-item ${stn.id === selectedStationId ? 'focused' : ''}`}
                          onClick={() => handleSelectStation(stn.id)}
                          role="option"
                          aria-selected={stn.id === selectedStationId}
                        >
                          <div>
                            <div className="station-dropdown-name">
                              {stn.name} <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>({stn.code})</span>
                            </div>
                            <div className="station-dropdown-meta">
                              {stn.lineNames.join(' • ')} {stn.interchange ? '• Interchange Hub' : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-body)', fontWeight: 600 }}>
                            {stn.platforms.length} platforms
                          </span>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--color-body)' }}>
                        No metro stations found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verified Data Filters: Display Metro line and platform/direction filter ONLY when verified data is available */}
          {selectedStation && (
            <div className="verified-filters-row">
              {/* Verified Lines */}
              {selectedStation.lineNames && selectedStation.lineNames.length > 0 && (
                <div className="filter-badge-group">
                  <span className="filter-label-tag">Verified Lines:</span>
                  {selectedStation.lineNames.map((line) => (
                    <span key={line} className="line-indicator-chip">
                      <span
                        className="line-color-dot"
                        style={{ backgroundColor: lineColors[line] || '#48B9E8' }}
                        aria-hidden="true"
                      />
                      {line}
                    </span>
                  ))}
                  {selectedStation.interchange && (
                    <span className="line-indicator-chip" style={{ background: '#ecfdf5', borderColor: '#bbf7d0', color: '#16a34a' }}>
                      Interchange Station
                    </span>
                  )}
                </div>
              )}

              {/* Verified Platforms and Directions */}
              {verifiedPlatforms.length > 0 ? (
                <div className="filter-badge-group" style={{ marginLeft: 'auto' }}>
                  <span className="filter-label-tag">Platform / Direction:</span>
                  {verifiedPlatforms.map((plt) => {
                    const isCurrent = plt.id === selectedPlatformId;
                    return (
                      <button
                        key={plt.id}
                        type="button"
                        className={`platform-pill-btn ${isCurrent ? 'active' : ''}`}
                        onClick={() => setSelectedPlatformId(plt.id)}
                        aria-pressed={isCurrent}
                      >
                        {plt.name} {plt.direction ? `(${plt.direction})` : ''}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-body)', fontStyle: 'italic' }}>
                  Platform breakdown unavailable for this station
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Main Station Content or Empty State ── */}
        {!selectedStation ? (
          /* Empty State if no station is selected */
          <div className="empty-station-card" role="status" aria-label="No station selected">
            <div className="empty-state-icon-wrap" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="3" width="16" height="16" rx="2" />
                <path d="M4 11h16" />
                <path d="M12 3v8" />
                <path d="M8 19l-2 3" />
                <path d="M16 19l2 3" />
                <circle cx="8" cy="15" r="1" />
                <circle cx="16" cy="15" r="1" />
              </svg>
            </div>

            <h3 className="empty-state-title">Select a Metro Station</h3>
            <p className="empty-state-text">
              Search or choose a Delhi Metro station above to view real-time platform crowd status,
              5 to 15-minute AI occupancy predictions, and safety advisories.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <span className="quick-stations-title">Quick Select Monitored Stations:</span>
              <div className="quick-stations-grid">
                {allStations.slice(0, 5).map((stn) => (
                  <button
                    key={stn.id}
                    type="button"
                    className="quick-station-chip"
                    onClick={() => handleSelectStation(stn.id)}
                  >
                    {stn.name} ({stn.code})
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Station Dashboard */
          <>
            {/* ── Section B: Current Crowd Status ── */}
            <CurrentCrowdStatusCard
              stationName={selectedStation.name}
              platformName={activePlatform ? `${activePlatform.name} • ${activePlatform.direction || 'General'}` : undefined}
              observation={currentObservation}
            />

            {/* ── Section C: Crowd Prediction (5, 10, 15 min & Recharts Graph) ── */}
            <CrowdPredictionSection
              stationName={selectedStation.name}
              platformName={activePlatform ? activePlatform.name : undefined}
              currentObservedCount={currentObservation?.personCount ?? null}
              currentCrowdLevel={currentObservation?.crowdLevel || 'unavailable'}
              predictions={currentPredictions}
              recentTrend={currentTrend}
            />

            {/* ── Section D: Passenger Crowd Report Toggle (Directly on Station Dashboard) ── */}
            <StationCrowdReportToggle
              stationName={selectedStation.name}
              platformName={activePlatform ? activePlatform.name : undefined}
            />

            {/* ── Section E: Crowd Alerts (Passenger Facing & Demo Labelled) ── */}
            <StationAlertsSection
              stationName={selectedStation.name}
              alerts={stationAlerts}
            />

            {/* ── Commuter Navigation Shortcuts ── */}
            <div style={{ marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-dark-blue)', marginBottom: '0.85rem' }}>
                Additional Passenger Tools
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Link
                  to="/user/journey-planner"
                  style={{
                    textDecoration: 'none',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all var(--transition-fast)',
                  }}
                  className="hover-card"
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#F4FAFD',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-dark-blue)', fontSize: '0.9rem' }}>Smart Journey Planner</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-body)' }}>Find least crowded route</div>
                  </div>
                </Link>

                <Link
                  to="/user/crowd-status"
                  style={{
                    textDecoration: 'none',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all var(--transition-fast)',
                  }}
                  className="hover-card"
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#F4FAFD',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16a34a',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-dark-blue)', fontSize: '0.9rem' }}>All Stations Overview</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-body)' }}>Network platform status</div>
                  </div>
                </Link>

                <Link
                  to="/user/alerts"
                  style={{
                    textDecoration: 'none',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all var(--transition-fast)',
                  }}
                  className="hover-card"
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#F4FAFD',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ea580c',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-dark-blue)', fontSize: '0.9rem' }}>Network Advisories</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-body)' }}>View all line advisories</div>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
