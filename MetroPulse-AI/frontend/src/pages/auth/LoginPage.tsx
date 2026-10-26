import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../contexts/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('passenger');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotMsg, setForgotMsg] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setForgotMsg('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await login(email, password, role);
      navigate(role === 'admin' ? '/admin/overview' : '/user/home', { replace: true });
    } catch {
      setErrors({ form: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    setForgotMsg('Demo mode only — no password reset email is sent. Use any email and password to log in.');
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <Link to="/" className="auth-logo" aria-label="Back to home">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="url(#loginBrandGrad)" />
            <defs>
              <linearGradient id="loginBrandGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#06b6d4" /><stop offset="1" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <path d="M6 22h4V14H6v8zm5-14v14h4V8h-4zm5 6v8h4v-8h-4zm5-4v12h4V10h-4z" fill="#fff" />
          </svg>
          <span className="auth-logo-name">MetroPulse <span>AI</span></span>
        </Link>

        <div className="auth-left-content">
          <h2 className="auth-left-title">Smart Crowd Awareness for Metro Travel</h2>
          <p className="auth-left-sub">
            Get live crowd status, illustrative 15-minute forecasts, and journey planning — all in one place.
          </p>
          <div className="auth-left-features">
            {[
              'Real-time crowd level indicators',
              'Illustrative 15-minute predictions',
              'Journey planner with interchange details',
              'Passenger crowd reports and alerts',
            ].map(f => (
              <div key={f} className="auth-left-feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metro SVG illustration */}
        <div className="auth-left-visual" aria-hidden="true">
          <svg viewBox="0 0 300 120" className="auth-metro-svg">
            <defs>
              <linearGradient id="loginTrack" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="95" width="300" height="2" fill="url(#loginTrack)" />
            <rect x="0" y="105" width="300" height="2" fill="url(#loginTrack)" />
            {[20, 50, 80, 110, 140, 170, 200, 230, 260].map(x => (
              <rect key={x} x={x} y="94" width="8" height="13" fill="rgba(22,53,104,0.7)" rx="1" />
            ))}
            {/* Train */}
            <g className="auth-train-anim">
              <rect x="40" y="60" width="120" height="36" rx="6" fill="#0d1f3c" />
              <rect x="40" y="62" width="120" height="6" fill="url(#loginTrack)" opacity="0.8" />
              {[52, 82, 112, 132].map(x => (
                <rect key={x} x={x} y="70" width="22" height="16" rx="2" fill="rgba(34,211,238,0.2)" stroke="rgba(34,211,238,0.4)" strokeWidth="1" />
              ))}
              <circle cx="155" cy="78" r="4" fill="#fbbf24" opacity="0.9" />
              <circle cx="55" cy="98" r="6" fill="#0a1628" stroke="#22d3ee" strokeWidth="1.2" />
              <circle cx="95" cy="98" r="6" fill="#0a1628" stroke="#22d3ee" strokeWidth="1.2" />
              <circle cx="130" cy="98" r="6" fill="#0a1628" stroke="#22d3ee" strokeWidth="1.2" />
              <circle cx="155" cy="98" r="6" fill="#0a1628" stroke="#22d3ee" strokeWidth="1.2" />
            </g>
          </svg>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-subtitle">Sign in to your MetroPulse AI account</p>
          </div>

          {/* Role tabs */}
          <div className="auth-role-tabs" role="tablist" aria-label="Login mode">
            <button
              role="tab"
              aria-selected={role === 'passenger'}
              className={`auth-role-tab ${role === 'passenger' ? 'active' : ''}`}
              onClick={() => setRole('passenger')}
              id="tab-passenger"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Passenger
            </button>
            <button
              role="tab"
              aria-selected={role === 'admin'}
              className={`auth-role-tab ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
              id="tab-admin"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate aria-label="Login form">
            {errors.form && (
              <div className="form-alert" role="alert">{errors.form}</div>
            )}

            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email address</label>
              <input
                id="login-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                aria-invalid={!!errors.email}
              />
              {errors.email && <span id="login-email-error" className="form-error" role="alert">{errors.email}</span>}
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password" className="form-label">Password</label>
                <button type="button" className="forgot-link" onClick={handleForgot}>Forgot password?</button>
              </div>
              <div className="form-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  aria-invalid={!!errors.password}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="form-input-icon"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              {errors.password && <span id="login-password-error" className="form-error" role="alert">{errors.password}</span>}
            </div>

            {forgotMsg && (
              <div className="demo-notice" role="status">{forgotMsg}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
              id="login-submit-btn"
            >
              {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
              {loading ? 'Signing in…' : `Sign in as ${role === 'admin' ? 'Admin' : 'Passenger'}`}
            </button>
          </form>

          <div className="auth-demo-notice" role="note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            Demo mode — any email and password will work. This is not production-secure authentication.
          </div>

          <div className="auth-footer-links">
            <span>Don't have an account?</span>
            <Link to="/signup" id="login-signup-link">Create account</Link>
          </div>
          <div className="auth-footer-links" style={{ marginTop: '0.25rem' }}>
            <Link to="/" className="auth-back-home" id="login-home-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
