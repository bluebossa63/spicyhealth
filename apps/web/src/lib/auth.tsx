'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        setUser(user);
        setToken(token);
      } catch {}
    }
    setIsLoading(false);
  }, []);

  function persist(user: User, token: string) {
    setUser(user);
    setToken(token);
    localStorage.setItem('auth', JSON.stringify({ user, token }));
    localStorage.setItem('spicyhealth_onboarded', 'true');
  }

  async function login(email: string, password: string) {
    let res: Response;
    try {
      res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Server nicht erreichbar. Bitte Internetverbindung prüfen.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Anmeldung fehlgeschlagen');
    }
    const data = await res.json();
    persist(data.user, data.token);
  }

  async function register(displayName: string, email: string, password: string) {
    let res: Response;
    try {
      res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, password }),
      });
    } catch {
      throw new Error('Server nicht erreichbar. Bitte Internetverbindung prüfen.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registrierung fehlgeschlagen');
    }
    const data = await res.json();
    persist(data.user, data.token);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
  }

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
