import React from 'react';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        {(title || actions) && (
          <header className="dashboard-header">
            <div className="dashboard-header-left">
              {title && <h1 className="dashboard-page-title">{title}</h1>}
              {subtitle && <p className="dashboard-page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="dashboard-header-actions">{actions}</div>}
          </header>
        )}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
