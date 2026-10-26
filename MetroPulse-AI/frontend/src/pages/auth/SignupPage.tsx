import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../contexts/AuthContext';
import './AuthPages.css';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('passenger');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!confirm) e.confirm = 'Please confirm your password.';
    else if (confirm !== password) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await signup(name.trim(), email, password, role);
      navigate(role === 'admin' ? '/admin/overview' : '/user/home', { replace: true });
    } catch {
      setErrors({ form: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <Link to="/" className="auth-logo" aria-label="Back to home">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="url(#signupBrandGrad)" />
            <defs>
              <linearGradient id="signupBrandGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#06b6d4" /><stop offset="1" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <path d="M6 22h4V14H6v8zm5-14v14h4V8h-4zm5 6v8h4v-8h-4zm5-4v12h4V10h-4z" fill="#fff" />
          </svg>
          <span className="auth-logo-name">MetroPulse <span>AI</span></span>
        </Link>

        <div className="auth-left-content">
          <h2 className="auth-left-title">Join the smarter way to ride the metro</h2>
          <p className="auth-left-sub">
            Create your MetroPulse AI demo account to explore crowd intelligence features.
          </p>
          <div className="auth-left-features">
            {[
              'Personalised crowd status view',
              'Journey planner with crowd overlay',
              'Submit and track crowd reports',
              'Receive crowd alerts and notifications',
            ].map(f => (
              <div key={f} className="auth-left-feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-visual" aria-hidden="true">
          <div className="signup-visual-circles">
            <div className="svc-1" />
            <div className="svc-2" />
            <div className="svc-3" />
          </div>
        </div>
      </div>

      {/* Right panel — signup form */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create account</h1>
            <p className="auth-form-subtitle">Start exploring MetroPulse AI today</p>
          </div>

          {/* Role tabs */}
          <div className="auth-role-tabs" role="tablist" aria-label="Account type">
            <button
              role="tab"
              aria-selected={role === 'passenger'}
              className={`auth-role-tab ${role === 'passenger' ? 'active' : ''}`}
              onClick={() => setRole('passenger')}
              id="signup-tab-passenger"
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
              id="signup-tab-admin"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              Admin
            </button>
          </div>

          {role === 'admin' && (
            <div className="admin-role-notice" role="note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
              <span>
                <strong>Demo prototype only.</strong> In production, Admin accounts require authorised provisioning and server-side role verification. Selecting Admin here does not grant real administrative permissions.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate aria-label="Signup form">
            {errors.form && <div className="form-alert" role="alert">{errors.form}</div>}

            <div className="form-group">
              <label htmlFor="signup-name" className="form-label">Full name</label>
              <input
                id="signup-name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                aria-describedby={errors.name ? 'signup-name-error' : undefined}
                aria-invalid={!!errors.name}
              />
              {errors.name && <span id="signup-name-error" className="form-error" role="alert">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">Email address</label>
              <input
                id="signup-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                aria-invalid={!!errors.email}
              />
              {errors.email && <span id="signup-email-error" className="form-error" role="alert">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">Password</label>
              <div className="form-input-wrapper">
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-describedby={errors.password ? 'signup-password-error' : undefined}
                  aria-invalid={!!errors.password}
                  style={{ paddingRight: '44px' }}
                />
                <button type="button" className="form-input-icon" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              {errors.password && <span id="signup-password-error" className="form-error" role="alert">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="signup-confirm" className="form-label">Confirm password</label>
              <div className="form-input-wrapper">
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className={`form-input ${errors.confirm ? 'error' : ''}`}
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  aria-describedby={errors.confirm ? 'signup-confirm-error' : undefined}
                  aria-invalid={!!errors.confirm}
                  style={{ paddingRight: '44px' }}
                />
                <button type="button" className="form-input-icon" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              {errors.confirm && <span id="signup-confirm-error" className="form-error" role="alert">{errors.confirm}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
              id="signup-submit-btn"
            >
              {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
              {loading ? 'Creating account…' : `Create ${role === 'admin' ? 'Admin' : 'Passenger'} Account`}
            </button>
          </form>

          <div className="auth-demo-notice" role="note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            Demo mode only. No real account is created and no password is stored.
          </div>

          <div className="auth-footer-links">
            <span>Already have an account?</span>
            <Link to="/login" id="signup-login-link">Sign in</Link>
          </div>
          <div className="auth-footer-links" style={{ marginTop: '0.25rem' }}>
            <Link to="/" className="auth-back-home" id="signup-home-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
