import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiConfigState {
  baseUrl: string;
  apiKey: string;
  turnstileSiteKey: string;
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setTurnstileSiteKey: (key: string) => void;
  pasteAndApply: (raw: string) => { ok: boolean; message: string };
  getHeaders: () => Record<string, string>;
}

function parsePasted(raw: string) {
  const result: Record<string, string> = {};
  const trimmed = raw.trim();
  try {
    const j = JSON.parse(trimmed);
    if (j.baseUrl || j.url || j.apiUrl) result.baseUrl = j.baseUrl || j.url || j.apiUrl;
    if (j.apiKey || j.key || j.token) result.apiKey = j.apiKey || j.key || j.token;
    return result;
  } catch { /* */ }
  for (const line of trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const m = line.match(/^(baseUrl|url|apiUrl|apiKey|key|token)\s*[=:]\s*(.+)$/i);
    if (m) {
      const k = m[1].toLowerCase();
      const v = m[2].trim().replace(/^["']|["']$/g, '');
      if (k.includes('url')) result.baseUrl = v;
      else result.apiKey = v;
    } else if (line.startsWith('http')) result.baseUrl = line;
  }
  return result;
}

export const useApiConfigStore = create<ApiConfigState>()(
  persist(
    (set, get) => ({
      // Same origin — API gắn sẵn trên Worker
      baseUrl: '/api',
      apiKey: '',
      turnstileSiteKey: '',
      setBaseUrl: (baseUrl) => set({ baseUrl: baseUrl.replace(/\/$/, '') }),
      setApiKey: (apiKey) => set({ apiKey }),
      setTurnstileSiteKey: (turnstileSiteKey) => set({ turnstileSiteKey }),
      pasteAndApply: (raw) => {
        const parsed = parsePasted(raw);
        if (!parsed.baseUrl && !parsed.apiKey) {
          return { ok: false, message: 'Không nhận diện được URL' };
        }
        set((s) => ({
          baseUrl: parsed.baseUrl ?? s.baseUrl,
          apiKey: parsed.apiKey ?? s.apiKey,
        }));
        return { ok: true, message: 'Đã cập nhật' };
      },
      getHeaders: () => {
        const { apiKey } = get();
        const h: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) h['Authorization'] = `Bearer ${apiKey}`;
        return h;
      },
    }),
    { name: 'kitehood-api-config' }
  )
);

export async function apiFetch(path: string, init: RequestInit = {}) {
  const state = useApiConfigStore.getState();
  const base = state.baseUrl || '/api';
  const url = path.startsWith('http')
    ? path
    : `${base}${path.startsWith('/') ? path : '/' + path}`;
  const headers: Record<string, string> = {
    ...state.getHeaders(),
    ...(init.headers as Record<string, string> || {}),
  };
  // JWT tu dang nhap (kitehood-auth) — bat buoc cho /admin/*
  if (!headers.Authorization && !headers.authorization) {
    try {
      const raw = localStorage.getItem('kitehood-auth');
      if (raw) {
        const j = JSON.parse(raw);
        const token = j?.state?.token || j?.token;
        if (token) headers.Authorization = 'Bearer ' + token;
      }
    } catch { /* */ }
  }
  return fetch(url, { ...init, headers });
}
