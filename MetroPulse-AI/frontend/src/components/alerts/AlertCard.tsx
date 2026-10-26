import type { CrowdAlert } from '../../types/alert';
import '../../components/components.css';

interface AlertCardProps {
  alert: CrowdAlert;
  onAction?: (id: string, action: 'acknowledge' | 'resolve') => void;
  showActions?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
  });
}

const typeIcons: Record<string, React.ReactNode> = {
  crowd_critical: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  crowd_high: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  system_data: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  service_disruption: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>,
  passenger_report: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
};

export default function AlertCard({ alert, onAction, showActions = false }: AlertCardProps) {
  return (
    <div className={`alert-card alert-${alert.status}`} role="article" aria-label={`Alert: ${alert.message}`}>
      <div className={`alert-card-icon icon-${alert.type}`} aria-hidden="true">
        {typeIcons[alert.type] ?? typeIcons.crowd_high}
      </div>
      <div className="alert-card-body">
        <div className="alert-card-meta">
          <span className="alert-card-location">{alert.stationName} · {alert.platformName}</span>
          <span className={`badge badge-${alert.status}`}>{alert.status}</span>
        </div>
        <p className="alert-card-message">{alert.message}</p>
        <span className="alert-card-time">{formatTime(alert.createdAt)}</span>
      </div>
      {showActions && alert.status === 'active' && onAction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onAction(alert.id, 'acknowledge')}>Acknowledge</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onAction(alert.id, 'resolve')}>Resolve</button>
        </div>
      )}
    </div>
  );
}
