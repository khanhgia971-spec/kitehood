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
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.startsWith('<!')
        ? 'API tra HTML — kiem tra run_worker_first / Worker deploy'
        : text.slice(0, 120) || 'Loi mang'
    );
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),

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
        const token = params.get('token');
        const err = params.get('error');
        if (err) throw new Error(err);
        if (!token) return false;
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseJson(res);
        if (res.ok && data.user) {
          set({ token, user: data.user });
        } else {
          set({
            token,
            user: data.user || { id: 'oauth', email: '', username: 'user', role: 'user' },
          });
        }
        window.history.replaceState({}, '', '/login');
        return true;
      },
    }),
    {
      name: 'kitehood-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);
