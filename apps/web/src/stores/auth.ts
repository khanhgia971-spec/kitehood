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

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  applyTokenFromUrl: () => Promise<boolean>;
};

async function parseJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error(text.trimStart().startsWith('<') ? 'API HTML' : text.slice(0, 80) || 'Loi'); }
}

function fromJwt(token: string): AuthUser {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(b64));
    return {
      id: String(p.sub || 'u'),
      username: String(p.email || p.sub || 'user'),
      email: String(p.email || ''),
      role: String(p.role || 'user'),
    };
  } catch {
    return { id: 'u', username: 'user', email: '', role: 'user' };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user });
        try {
          localStorage.setItem(
            'kitehood-auth',
            JSON.stringify({ state: { token, user }, version: 0 })
          );
        } catch {}
      },
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
          body: JSON.stringify({ email, password, username: name || email.split('@')[0] }),
        });
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data.error || 'Dang ky that bai');
        set({ token: data.token, user: data.user });
      },
      applyTokenFromUrl: async () => {
        const q = new URLSearchParams(window.location.search);
        if (q.get('error')) throw new Error(q.get('error') || 'OAuth error');
        const token = q.get('token');
        if (!token) return false;
        const user = fromJwt(token);
        set({ token, user });
        try {
          localStorage.setItem(
            'kitehood-auth',
            JSON.stringify({ state: { token, user }, version: 0 })
          );
        } catch {}
        try { history.replaceState({}, '', '/code'); } catch {}
        // me optional 2s
        try {
          const ac = new AbortController();
          const t = setTimeout(() => ac.abort(), 2000);
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: 'Bearer ' + token },
            signal: ac.signal,
          });
          clearTimeout(t);
          const data = await parseJson(res);
          if (data.user) set({ token, user: data.user });
        } catch {}
        return true;
      },
    }),
    { name: 'kitehood-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
