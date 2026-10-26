import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

// ─── Animated Metro SVG ───────────────────────────────────────────────────────
function MetroTrain({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="trainBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0d2447" />
        </linearGradient>
        <linearGradient id="trainStripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      {/* Train body */}
      <rect x="10" y="10" width="195" height="42" rx="8" fill="url(#trainBody)" />
      <rect x="10" y="14" width="195" height="6" fill="url(#trainStripe)" opacity="0.9" />
      {/* Windows */}
      <rect x="25" y="22" width="28" height="18" rx="3" fill="rgba(34,211,238,0.25)" stroke="rgba(34,211,238,0.4)" strokeWidth="1" />
      <rect x="62" y="22" width="28" height="18" rx="3" fill="rgba(34,211,238,0.25)" stroke="rgba(34,211,238,0.4)" strokeWidth="1" />
      <rect x="99" y="22" width="28" height="18" rx="3" fill="rgba(34,211,238,0.25)" stroke="rgba(34,211,238,0.4)" strokeWidth="1" />
      <rect x="136" y="22" width="28" height="18" rx="3" fill="rgba(34,211,238,0.25)" stroke="rgba(34,211,238,0.4)" strokeWidth="1" />
      <rect x="173" y="22" width="20" height="18" rx="3" fill="rgba(34,211,238,0.15)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
      {/* Headlight */}
      <circle cx="200" cy="31" r="5" fill="#fbbf24" opacity="0.9" />
      <circle cx="200" cy="31" r="9" fill="#fbbf24" opacity="0.15" />
      {/* Wheels */}
      <circle cx="35" cy="55" r="8" fill="#0a1628" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="35" cy="55" r="4" fill="#163568" />
      <circle cx="75" cy="55" r="8" fill="#0a1628" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="75" cy="55" r="4" fill="#163568" />
      <circle cx="145" cy="55" r="8" fill="#0a1628" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="145" cy="55" r="4" fill="#163568" />
      <circle cx="185" cy="55" r="8" fill="#0a1628" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="185" cy="55" r="4" fill="#163568" />
      {/* Undercarriage */}
      <rect x="10" y="48" width="195" height="8" rx="0" fill="#0d1f3c" />
    </svg>
  );
}

// ─── Animated Track Scene ─────────────────────────────────────────────────────
function MetroScene() {
  return (
    <div className="metro-scene" aria-hidden="true">
      {/* Sky gradient */}
      <div className="metro-sky" />
      {/* City silhouette */}
      <div className="metro-city">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="city-building" style={{
            height: `${40 + Math.sin(i * 1.3) * 30}px`,
            width: `${18 + (i % 3) * 10}px`,
            left: `${i * 8.5}%`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      {/* Track */}
      <div className="metro-track">
        <div className="track-rail track-rail-top" />
        <div className="track-rail track-rail-bottom" />
        {[...Array(20)].map((_, i) => (
          <div key={i} className="track-tie" style={{ left: `${i * 5.5}%` }} />
        ))}
      </div>
      {/* Train */}
      <div className="metro-train-wrapper">
        <MetroTrain className="metro-train-svg" />
        {/* Motion blur / speed lines */}
        <div className="speed-lines">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="speed-line" style={{
              top: `${20 + i * 8}px`,
              animationDelay: `${i * 0.1}s`,
              opacity: 0.3 - i * 0.04,
            }} />
          ))}
        </div>
      </div>
      {/* Station platform */}
      <div className="metro-platform">
        <div className="platform-roof" />
        <div className="platform-body" />
        <div className="platform-post" style={{ left: '10%' }} />
        <div className="platform-post" style={{ left: '50%' }} />
        <div className="platform-post" style={{ left: '90%' }} />
        <div className="platform-sign">RAJIV CHOWK</div>
        {/* Waiting passengers (silhouettes) */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="passenger-silhouette" style={{ left: `${12 + i * 14}%`, height: `${22 + (i%2)*4}px` }} />
        ))}
      </div>
      {/* Glow effect under train */}
      <div className="train-glow" />
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: number;
}
function FeatureCard({ icon, title, desc, delay = 0 }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisible(true);
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`feature-card ${visible ? 'visible' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="step-card">
      <div className="step-number">{num}</div>
      <div>
        <div className="step-title">{title}</div>
        <div className="step-desc">{desc}</div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleExplore = () => {
    if (isAuthenticated && user?.role === 'passenger') navigate('/user/home');
    else navigate('/login');
  };

  const handleAdmin = () => navigate('/login');

  return (
    <div className="landing-page">
      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="landing-nav-inner">
          <Link to="/" className="nav-brand" aria-label="MetroPulse AI home">
            <span className="brand-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#brandGrad)" />
                <defs>
                  <linearGradient id="brandGrad" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#06b6d4" />
                    <stop offset="1" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <path d="M6 22h4V14H6v8zm5-14v14h4V8h-4zm5 6v8h4v-8h-4zm5-4v12h4V10h-4z" fill="#fff" />
              </svg>
            </span>
            <span className="brand-name">MetroPulse <span className="brand-ai">AI</span></span>
          </Link>

          <div className="nav-links" role="list">
            <a href="#features" className="nav-link" role="listitem">Features</a>
            <a href="#how-it-works" className="nav-link" role="listitem">How It Works</a>
            <a href="#demo" className="nav-link" role="listitem">Demo</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn btn-ghost btn-sm" id="nav-signin">Sign In</Link>
            <Link to="/signup" className="btn btn-primary btn-sm" id="nav-signup">Get Started</Link>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#demo" onClick={() => setMobileMenuOpen(false)}>Demo Preview</a>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/signup" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-bg-grid" aria-hidden="true" />
        <div className="hero-orbs" aria-hidden="true">
          <div className="hero-orb orb-1" />
          <div className="hero-orb orb-2" />
          <div className="hero-orb orb-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-fade-in-up">
            <span className="hero-badge-dot" aria-hidden="true" />
            AI-Powered Metro Crowd Intelligence
          </div>
          <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Navigate Smarter.<br />
            <span className="hero-title-accent">Beat the Crowd.</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            MetroPulse AI delivers real-time crowd awareness and illustrative 15-minute forecasts
            for metro stations — helping passengers plan journeys and admins monitor conditions.
          </p>
          <div className="hero-ctas animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button className="btn btn-primary btn-lg hero-cta-primary" onClick={handleExplore} id="hero-explore-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              Explore Passenger Dashboard
            </button>
            <button className="btn btn-secondary btn-lg" onClick={handleAdmin} id="hero-admin-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>
              Admin Access
            </button>
          </div>
          <div className="hero-notice animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            This prototype uses illustrative demo data — not live CCTV or a trained ML model.
          </div>
        </div>

        {/* Metro Animation Scene */}
        <div className="hero-metro-scene">
          <MetroScene />
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator" aria-hidden="true">
          <div className="scroll-dot" />
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section id="features" className="features-section" aria-label="Features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title-lg">Everything you need for crowd-aware metro travel</h2>
            <p className="section-subtitle-lg">From real-time status to illustrative forecasts, MetroPulse AI keeps you informed.</p>
          </div>
          <div className="features-grid">
            <FeatureCard
              delay={0}
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
              title="Live Crowd Status"
              desc="See illustrative crowd density levels for any metro station and platform — Low, Moderate, High, or Critical — with clear visual indicators."
            />
            <FeatureCard
              delay={100}
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
              title="15-Minute Forecast"
              desc="Get illustrative short-term crowd predictions so you can decide whether to wait, walk, or take an alternate route."
            />
            <FeatureCard
              delay={200}
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
              title="Crowd Analytics"
              desc="Admins get rich visual analytics — platform comparisons, trend charts, forecast vs. actual, and crowd-level distributions."
            />
            <FeatureCard
              delay={300}
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>}
              title="Crowd Alerts"
              desc="Passengers see crowd-level alerts and can report high-crowd conditions. Admins review and manage reports with full audit trail."
            />
            <FeatureCard
              delay={400}
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>}
              title="Journey Planner"
              desc="Plan your route between metro stations, discover interchanges, and see crowd conditions along your path."
            />
            <FeatureCard
              delay={500}
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
              title="Video Monitoring"
              desc="Demo interface showing how video-based crowd monitoring will work — with station/platform feeds and processing status."
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how-it-works" className="how-section" aria-label="How it works">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Process</span>
            <h2 className="section-title-lg">Simple steps, smarter journeys</h2>
          </div>
          <div className="steps-layout">
            <div className="steps-list">
              <StepCard num={1} title="Select Your Station" desc="Choose any metro station from the dropdown to see its current crowd conditions." />
              <StepCard num={2} title="Review Crowd Status" desc="Instantly see whether the platform is Low, Moderate, High, or Critical with colour-coded indicators." />
              <StepCard num={3} title="Check the Forecast" desc="View the illustrative 15-minute crowd prediction so you can plan ahead and avoid peak crush." />
              <StepCard num={4} title="Submit a Report" desc="Spotted something the system missed? Submit a passenger crowd report directly from the app." />
            </div>
            <div className="steps-visual">
              <div className="steps-card-preview">
                <div className="preview-card-label badge badge-demo">DEMO DATA</div>
                <div className="preview-station-name">Rajiv Chowk · Platform 1</div>
                <div className="preview-crowd-indicator high">
                  <div className="preview-crowd-bar" />
                  <div className="preview-crowd-text">
                    <span className="preview-level">HIGH CROWD</span>
                    <span className="preview-count">~312 persons</span>
                  </div>
                </div>
                <div className="preview-divider" />
                <div className="preview-forecast">
                  <span className="preview-forecast-label">15-min Forecast</span>
                  <span className="preview-forecast-value high">↑ HIGH · ~368 persons</span>
                </div>
                <div className="preview-trend">
                  <div className="mini-bars">
                    {[30, 55, 70, 85, 65, 90, 100, 95].map((h, i) => (
                      <div key={i} className="mini-bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span className="preview-trend-label">Today's trend</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO PREVIEW ───────────────────────────────────────────── */}
      <section id="demo" className="demo-section" aria-label="Demo preview">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Preview</span>
            <h2 className="section-title-lg">See it in action</h2>
            <p className="section-subtitle-lg">Explore the demo dashboards with illustrative crowd data.</p>
          </div>
          <div className="demo-cards">
            <Link to="/login" className="demo-entry-card passenger-card" id="demo-passenger-card">
              <div className="demo-entry-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <h3>Passenger Dashboard</h3>
              <p>Check crowd status, view forecasts, plan your journey, and submit crowd reports.</p>
              <div className="demo-entry-arrow" aria-hidden="true">→</div>
            </Link>
            <Link to="/login" className="demo-entry-card admin-card" id="demo-admin-card">
              <div className="demo-entry-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              </div>
              <h3>Admin Dashboard</h3>
              <p>Monitor all stations, manage alerts, review passenger reports, and explore analytics.</p>
              <div className="demo-entry-arrow" aria-hidden="true">→</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="landing-footer" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="nav-brand footer-brand-link" aria-label="MetroPulse AI">
              <span className="brand-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#footerBrandGrad)" />
                  <defs>
                    <linearGradient id="footerBrandGrad" x1="0" y1="0" x2="32" y2="32">
                      <stop stopColor="#06b6d4" /><stop offset="1" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <path d="M6 22h4V14H6v8zm5-14v14h4V8h-4zm5 6v8h4v-8h-4zm5-4v12h4V10h-4z" fill="#fff" />
                </svg>
              </span>
              <span className="brand-name">MetroPulse <span className="brand-ai">AI</span></span>
            </Link>
            <p className="footer-tagline">Smart crowd intelligence for modern metro systems.</p>
          </div>
          <div className="footer-links">
            <Link to="/login" id="footer-signin">Sign In</Link>
            <Link to="/signup" id="footer-signup">Create Account</Link>
          </div>
          <div className="footer-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            This prototype uses illustrative demo data only. No live CCTV, no trained ML model, no real metro network connection.
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 MetroPulse AI · Prototype · For demonstration purposes only.</span>
        </div>
      </footer>
    </div>
  );
}
