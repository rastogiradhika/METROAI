import React, { createContext, useContext, useState, useCallback } from 'react';

export type UserRole = 'passenger' | 'admin';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: DemoUser | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string, role: UserRole) => Promise<void>;
  signup: (name: string, email: string, _password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'metropulse_demo_session';

function loadSession(): DemoUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

function saveSession(user: DemoUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(loadSession);

  const login = useCallback(async (email: string, _password: string, role: UserRole) => {
    const demoUser: DemoUser = {
      id: `demo-${role}-${Date.now()}`,
      name: role === 'admin' ? 'Demo Admin' : 'Demo Passenger',
      email,
      role,
    };
    saveSession(demoUser);
    setUser(demoUser);
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string, role: UserRole) => {
    const demoUser: DemoUser = {
      id: `demo-${role}-${Date.now()}`,
      name,
      email,
      role,
    };
    saveSession(demoUser);
    setUser(demoUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
