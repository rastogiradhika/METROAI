import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

export default function NotFoundPage() {
  const { isAuthenticated, user } = useAuth();
  const dashboardLink = isAuthenticated
    ? user?.role === 'admin' ? '/admin/overview' : '/user/home'
    : '/';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-navy-950)',
      color: 'var(--text-primary)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '50%',
        width: '96px',
        height: '96px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan-400)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
        404 <span style={{ color: 'var(--color-cyan-400)', fontWeight: 400 }}>| Station Not Found</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
        The transit line or page you are trying to access does not exist or has been rerouted.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to={dashboardLink} className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Return to Dashboard
        </Link>
        <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          MetroPulse Home
        </Link>
      </div>
    </div>
  );
}
