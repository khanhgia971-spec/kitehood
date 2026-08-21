import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  applyTokenFromUrl: () => Promise<boolean>;
}

async function parseJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch {
    throw new Error(text.trimStart().startsWith('<') ? 'API tra HTML' : text.slice(0, 100) || 'Loi');
  }
}

function userFromJwt(token: string): AuthUser {
  try {
    const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return {
      id: String(p.sub || 'oauth'),
      username: String(p.email || p.sub || 'user'),
      email: String(p.email || ''),
      role: String(p.role || 'user'),
    };
  } catch {
    return { id: 'oauth', username: 'user', email: '', role: 'user' };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        set({ token: null, user: null });
        try { localStorage.removeItem('kitehood-auth'); } catch {}
      },
      login: async (email, password) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data.error || 'Email hoac mat khau sai');
        set({ token: data.token, user: data.user });
      },
      register: async (email, password, name) => {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username: name }),
        });
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data.error || 'Dang ky that bai');
        set({ token: data.token, user: data.user });
      },
      applyTokenFromUrl: async () => {
        const token = new URLSearchParams(window.location.search).get('token');
        const err = new URLSearchParams(window.location.search).get('error');
        if (err) throw new Error(err);
        if (!token) return false;
        let user = userFromJwt(token);
        set({ token, user });
        try { window.history.replaceState({}, '', '/code'); } catch {}
        try {
          const ctrl = new AbortController();
          setTimeout(() => ctrl.abort(), 2500);
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: 'Bearer ' + token },
            signal: ctrl.signal,
          });
          const data = await parseJson(res);
          if (data.user) set({ token, user: data.user });
        } catch {}
        return true;
      },
    }),
    { name: 'kitehood-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
