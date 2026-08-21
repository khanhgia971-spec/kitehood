import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  banned?: boolean;
  banReason?: string;
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
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.trimStart().startsWith('<')
        ? 'API tra HTML — Worker/SPA'
        : text.slice(0, 120) || 'Loi mang'
    );
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
        try {
          localStorage.removeItem('kitehood-auth');
        } catch {}
      },

      login: async (email, password) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await parseJson(res);
        if (!res.ok) {
          const err: any = new Error(data.error || 'Dang nhap that bai');
          err.banned = data.banned;
          err.reason = data.reason;
          throw err;
        }
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
        const params = new URLSearchParams(window.location.search);
        const err = params.get('error');
        if (err) throw new Error(err);
        const token = params.get('token');
        if (!token) return false;

        // Luu NGAY — khong treo
        let user = userFromJwt(token);
        set({ token, user });
        try {
          window.history.replaceState({}, '', '/code');
        } catch {}

        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 2500);
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: 'Bearer ' + token },
            signal: ctrl.signal,
          });
          clearTimeout(t);
          const data = await parseJson(res);
          if (data.banned || data.user?.banned) {
            set({ token: null, user: null });
            throw new Error(data.reason || data.error || 'Tai khoan bi khoa');
          }
          if (data.user) set({ token, user: data.user });
        } catch (e: any) {
          if (e?.message && /khoa|banned|ban/i.test(e.message)) throw e;
        }
        return true;
      },
    }),
    {
      name: 'kitehood-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);
