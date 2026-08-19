import { useAuthStore } from '../stores/auth';
import { useAIStore } from '../stores/ai';
import { useLearnStore } from '../stores/learn';
import { useFSStore } from '../stores/fs';

function apiBase() {
  return '/api';
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Chưa đăng nhập');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `HTTP ${res.status}`);
  return data;
}

export async function pushToCloud() {
  const ai = useAIStore.getState();
  const learn = useLearnStore.getState();
  const fs = useFSStore.getState();

  const payload = {
    ai: {
      provider: ai.provider,
      baseUrl: ai.baseUrl,
      model: ai.model,
      conversations: ai.conversations,
      activeConvId: ai.activeConvId,
    },
    learn: {
      chapters: learn.chapters,
      exercises: learn.exercises,
      progress: learn.progress,
    },
    fs: {
      project: fs.project,
      nodes: fs.nodes,
      rootIds: fs.rootIds,
    },
    prefs: {
      theme:
        typeof document !== 'undefined'
          ? document.documentElement.getAttribute('data-theme')
          : 'dark',
    },
  };

  return authFetch('/sync', { method: 'PUT', body: JSON.stringify(payload) });
}

export async function pullFromCloud() {
  const data = (await authFetch('/sync', { method: 'GET' })) as {
    ai?: any;
    learn?: any;
    fs?: any;
    prefs?: any;
  };

  if (data.ai) {
    const cur = useAIStore.getState();
    useAIStore.setState({
      provider: data.ai.provider || cur.provider,
      baseUrl: data.ai.baseUrl || cur.baseUrl,
      model: data.ai.model || cur.model,
      conversations: data.ai.conversations || cur.conversations,
      activeConvId: data.ai.activeConvId || cur.activeConvId,
    });
  }

  if (data.learn) {
    useLearnStore.setState({
      chapters: data.learn.chapters || useLearnStore.getState().chapters,
      exercises: data.learn.exercises || useLearnStore.getState().exercises,
      progress: data.learn.progress || useLearnStore.getState().progress,
    });
  }

  if (data.fs?.nodes) {
    useFSStore.setState({
      project: data.fs.project || useFSStore.getState().project,
      nodes: data.fs.nodes,
      rootIds: data.fs.rootIds || [],
      expanded: new Set(),
    });
    window.dispatchEvent(new CustomEvent('fs:imported'));
  }

  return data;
}

export async function clearCloud() {
  return authFetch('/sync', { method: 'DELETE' });
}

let timer: ReturnType<typeof setTimeout> | null = null;
export function scheduleCloudPush(delayMs = 2500) {
  if (!useAuthStore.getState().token) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    pushToCloud().catch((e) => console.warn('cloud push', e));
  }, delayMs);
}
