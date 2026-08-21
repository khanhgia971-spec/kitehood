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
    throw new Error(text.trimStart().startsWith('<') ? 'API tra HTML' : (text.slice(0, 100) || 'Loi'));
  }
}

function userFromJwt(token: string): AuthUser {
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    return {
      id: p.sub || 'oauth',
      username: p.email || p.sub || 'user',
      email: p.email || '',
      role: p.role || 'user',
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
        if (!res.ok) throw new Error(data.error || 'Dang nhap that bai');
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

        // 1) Luu ngay tu JWT — KHONG doi me
        let user = userFromJwt(token);
        set({ token, user });
        try {
          window.history.replaceState({}, '', '/code');
        } catch {}

        // 2) me trong 3s — co thi cap nhat, khong thi bo
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 3000);
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: 'Bearer ' + token },
            signal: ctrl.signal,
          });
          clearTimeout(t);
          const data = await parseJson(res);
          if (data.user) {
            user = data.user;
            set({ token, user });
          }
        } catch {
          /* bo qua — da co user tu JWT */
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
