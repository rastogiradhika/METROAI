import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Public
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Passenger
import HomePage from './pages/passenger/HomePage';
import JourneyPlannerPage from './pages/passenger/JourneyPlannerPage';
import CrowdStatusPage from './pages/passenger/CrowdStatusPage';
import PredictionsPage from './pages/passenger/PredictionsPage';
import AlertsPage from './pages/passenger/AlertsPage';

// Admin
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import VideoMonitoringPage from './pages/admin/VideoMonitoringPage';
import CrowdAnalyticsPage from './pages/admin/CrowdAnalyticsPage';
import AlertsReportsPage from './pages/admin/AlertsReportsPage';

// Not found
import NotFoundPage from './pages/NotFoundPage';

function RequireAuth({ children, role }: { children: React.ReactNode; role: 'passenger' | 'admin' }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin/overview' : '/user/home'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Passenger */}
      <Route path="/user/home" element={<RequireAuth role="passenger"><HomePage /></RequireAuth>} />
      <Route path="/user/dashboard" element={<RequireAuth role="passenger"><HomePage /></RequireAuth>} />
      <Route path="/user/journey-planner" element={<RequireAuth role="passenger"><JourneyPlannerPage /></RequireAuth>} />
      <Route path="/user/crowd-status" element={<RequireAuth role="passenger"><CrowdStatusPage /></RequireAuth>} />
      <Route path="/user/predictions" element={<RequireAuth role="passenger"><PredictionsPage /></RequireAuth>} />
      <Route path="/user/alerts" element={<RequireAuth role="passenger"><AlertsPage /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin/overview" element={<RequireAuth role="admin"><AdminOverviewPage /></RequireAuth>} />
      <Route path="/admin/video-monitoring" element={<RequireAuth role="admin"><VideoMonitoringPage /></RequireAuth>} />
      <Route path="/admin/analytics" element={<RequireAuth role="admin"><CrowdAnalyticsPage /></RequireAuth>} />
      <Route path="/admin/alerts" element={<RequireAuth role="admin"><AlertsReportsPage /></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
