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
  updateProfile: (data: { username?: string; avatarUrl?: string }) => Promise<void>;
};

async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.trimStart().startsWith('<')
        ? 'API tra HTML — deploy Worker + hard refresh'
        : text.slice(0, 120) || 'Loi mang'
    );
  }
}

function fromJwt(token: string): AuthUser {
  try {
    const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
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
    (set, get) => ({
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
        if (!res.ok) throw new Error(data.error || 'Email hoac mat khau sai');
        set({ token: data.token, user: data.user });
      },
      register: async (email, password, name) => {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            username: name || email.split('@')[0],
          }),
        });
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data.error || 'Dang ky that bai');
        set({ token: data.token, user: data.user });
      },
      applyTokenFromUrl: async () => {
        const q = new URLSearchParams(window.location.search);
        if (q.get('error')) throw new Error(q.get('error') || 'OAuth');
        const token = q.get('token');
        if (!token) return false;
        set({ token, user: fromJwt(token) });
        try {
          history.replaceState({}, '', '/code');
        } catch {}
        try {
          const ac = new AbortController();
          setTimeout(() => ac.abort(), 2000);
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: 'Bearer ' + token },
            signal: ac.signal,
          });
          const data = await parseJson(res);
          if (data.user) set({ token, user: data.user });
        } catch {}
        return true;
      },
      updateProfile: async ({ username, avatarUrl }) => {
        const token = get().token;
        if (!token) throw new Error('Chua dang nhap');
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify({ username, avatarUrl }),
        });
        const data = await parseJson(res);
        if (!res.ok) throw new Error(data.error || 'Cap nhat that bai');
        set({ user: data.user });
      },
    }),
    { name: 'kitehood-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
