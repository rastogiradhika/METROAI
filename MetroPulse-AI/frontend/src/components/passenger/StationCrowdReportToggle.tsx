import React, { useState } from 'react';

interface StationCrowdReportToggleProps {
  stationName: string;
  platformName?: string;
}

export const StationCrowdReportToggle: React.FC<StationCrowdReportToggleProps> = ({
  stationName,
  platformName,
}) => {
  const [isHighCrowd, setIsHighCrowd] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submissionTime, setSubmissionTime] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Local state only — simulates submission without server calls
    const now = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    setSubmissionTime(now);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setIsHighCrowd(false);
  };

  return (
    <div className="passenger-report-box" role="region" aria-label="Report Station Crowd Section">
      <div className="report-header-row">
        <div className="report-headings">
          <h3 className="report-main-title">Report Station Crowd</h3>
          <p className="report-question-text">
            Is the crowd high at {stationName}{platformName ? ` (${platformName})` : ''} right now?
          </p>
        </div>

        {/* UI preview disclaimer badge */}
        <div className="report-preview-notice" title="Developer & Demonstration Notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>UI preview only — no report is being saved or sent.</span>
        </div>
      </div>

      {isSubmitted ? (
        <div className="report-confirmation-alert" role="status" aria-live="polite">
          <div className="report-confirmation-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <div>Your station crowd report has been submitted.</div>
              <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 500, marginTop: '2px' }}>
                Recorded at {submissionTime} for {stationName}. Status: {isHighCrowd ? 'High crowd reported' : 'No high crowd indicated'}.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="platform-pill-btn"
            onClick={handleReset}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Update / New Report
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="report-controls-bar">
            {/* Toggle Switch */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label className="accessible-switch-label" htmlFor="high-crowd-toggle">
                <span className="switch-control-wrap">
                  <input
                    id="high-crowd-toggle"
                    type="checkbox"
                    role="switch"
                    aria-checked={isHighCrowd}
                    className="switch-checkbox-input"
                    checked={isHighCrowd}
                    onChange={(e) => setIsHighCrowd(e.target.checked)}
                  />
                  <span className="switch-slider" aria-hidden="true" />
                </span>
                <span className="switch-label-text">
                  High crowd: <strong style={{ color: isHighCrowd ? '#ea580c' : '#586775' }}>{isHighCrowd ? 'ON' : 'OFF'}</strong>
                </span>
              </label>
              <div className="switch-clarification-note">
                OFF means no high-crowd report is selected; it does not mean the station is uncrowded.
              </div>
            </div>

            {/* Explicit Submit Report button */}
            <button
              type="submit"
              className="report-submit-btn"
              id="submit-station-crowd-report"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Submit Report
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StationCrowdReportToggle;
