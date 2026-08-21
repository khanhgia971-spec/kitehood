import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider =
  | 'openai'
  | 'openrouter'
  | 'groq'
  | 'anthropic'
  | 'google'
  | 'xai'
  | 'deepseek'
  | 'mistral'
  | 'together'
  | 'perplexity'
  | 'fireworks'
  | 'cohere'
  | 'custom';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  at: number;
  attachedPaths?: string[];
};

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  messages: ChatMessage[];
  updatedAt: number;
};

export const PROVIDER_MODELS: Record<AIProvider, { id: string; label: string }[]> = {
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
    { id: 'gpt-5', label: 'GPT-5' },
    { id: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { id: 'o3-mini', label: 'o3-mini' },
    { id: 'o4-mini', label: 'o4-mini' },
    { id: 'o3', label: 'o3' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  openrouter: [
    { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'openai/gpt-4o', label: 'GPT-4o' },
    { id: 'openai/gpt-4.1', label: 'GPT-4.1' },
    { id: 'openai/o4-mini', label: 'o4-mini' },
    { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
    { id: 'anthropic/claude-opus-4', label: 'Claude Opus 4' },
    { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet' },
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    { id: 'google/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash' },
    { id: 'google/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro' },
    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    { id: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
    { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
    { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
    { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
    { id: 'qwen/qwen3-235b-a22b', label: 'Qwen3 235B' },
    { id: 'x-ai/grok-2', label: 'Grok 2' },
    { id: 'x-ai/grok-3-beta', label: 'Grok 3 Beta' },
    { id: 'mistralai/mistral-large', label: 'Mistral Large' },
    { id: 'mistralai/codestral-2501', label: 'Codestral' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout' },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick' },
    { id: 'qwen/qwen3-32b', label: 'Qwen3 32B' },
    { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill 70B' },
    { id: 'gemma2-9b-it', label: 'Gemma2 9B' },
    { id: 'mistral-saba-24b', label: 'Mistral Saba 24B' },
    { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { id: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' },
    { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
  ],
  google: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  xai: [
    { id: 'grok-2-latest', label: 'Grok 2' },
    { id: 'grok-2', label: 'Grok 2 (stable)' },
    { id: 'grok-3', label: 'Grok 3' },
    { id: 'grok-3-mini', label: 'Grok 3 Mini' },
    { id: 'grok-3-fast', label: 'Grok 3 Fast' },
  ],
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
  ],
  mistral: [
    { id: 'mistral-large-latest', label: 'Mistral Large' },
    { id: 'mistral-medium-latest', label: 'Mistral Medium' },
    { id: 'mistral-small-latest', label: 'Mistral Small' },
    { id: 'codestral-latest', label: 'Codestral' },
    { id: 'open-mistral-nemo', label: 'Mistral Nemo' },
    { id: 'pixtral-large-latest', label: 'Pixtral Large' },
  ],
  together: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Turbo' },
    { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B' },
    { id: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1' },
    { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen2.5 72B' },
    { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', label: 'Mixtral 8x22B' },
  ],
  perplexity: [
    { id: 'sonar', label: 'Sonar' },
    { id: 'sonar-pro', label: 'Sonar Pro' },
    { id: 'sonar-reasoning', label: 'Sonar Reasoning' },
    { id: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro' },
  ],
  fireworks: [
    { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', label: 'Llama 3.3 70B' },
    { id: 'accounts/fireworks/models/deepseek-r1', label: 'DeepSeek R1' },
    { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', label: 'Qwen2.5 72B' },
  ],
  cohere: [
    { id: 'command-r-plus', label: 'Command R+' },
    { id: 'command-r', label: 'Command R' },
    { id: 'command-a-03-2025', label: 'Command A' },
  ],
  custom: [{ id: 'gpt-4o-mini', label: 'Custom model id…' }],
};

const DEFAULTS: Record<AIProvider, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
  },
  xai: { baseUrl: 'https://api.x.ai/v1', model: 'grok-2-latest' },
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  mistral: { baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-large-latest' },
  together: {
    baseUrl: 'https://api.together.xyz/v1',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  perplexity: { baseUrl: 'https://api.perplexity.ai', model: 'sonar' },
  fireworks: { baseUrl: 'https://api.fireworks.ai/inference/v1', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct' },
  cohere: { baseUrl: 'https://api.cohere.com/compatibility/v1', model: 'command-r-plus' },
  custom: { baseUrl: '', model: 'gpt-4o-mini' },
};

export function detectProviderFromKey(raw: string): {
  provider: AIProvider;
  baseUrl: string;
  model: string;
  label: string;
} | null {
  const key = raw.trim().replace(/^["']|["']$/g, '');
  if (!key || key.length < 8) return null;

  if (/^gsk_/i.test(key))
    return { provider: 'groq', ...DEFAULTS.groq, label: 'Groq' };
  if (/^sk-or-/i.test(key))
    return { provider: 'openrouter', ...DEFAULTS.openrouter, label: 'OpenRouter' };
  if (/^sk-ant-/i.test(key))
    return { provider: 'anthropic', ...DEFAULTS.anthropic, label: 'Anthropic' };
  if (/^AIza/i.test(key))
    return { provider: 'google', ...DEFAULTS.google, label: 'Google AI Studio' };
  if (/^xai-/i.test(key))
    return { provider: 'xai', ...DEFAULTS.xai, label: 'xAI Grok' };
  if (/^pplx-/i.test(key))
    return { provider: 'perplexity', ...DEFAULTS.perplexity, label: 'Perplexity' };
  if (/^fw_/i.test(key))
    return { provider: 'fireworks', ...DEFAULTS.fireworks, label: 'Fireworks' };
  if (/^co\./i.test(key) || /^cohere_/i.test(key))
    return { provider: 'cohere', ...DEFAULTS.cohere, label: 'Cohere' };
  // Mistral keys often start with letters mixed
  if (/^[a-zA-Z0-9]{32}$/.test(key) && !key.startsWith('sk'))
    return null; // ambiguous
  if (/^sk-proj-/i.test(key) || /^sk-svcacct-/i.test(key))
    return { provider: 'openai', ...DEFAULTS.openai, label: 'OpenAI' };
  // DeepSeek: sk- followed by hex-ish, often 35+ chars without proj
  if (/^sk-[a-f0-9]{32,}$/i.test(key))
    return { provider: 'deepseek', ...DEFAULTS.deepseek, label: 'DeepSeek' };
  if (/^sk-[a-zA-Z0-9_-]+/.test(key))
    return { provider: 'openai', ...DEFAULTS.openai, label: 'OpenAI' };
  if (/^tts_/i.test(key))
    return { provider: 'together', ...DEFAULTS.together, label: 'Together AI' };

  return null;
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface AIState {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  lastDetectLabel: string;
  conversations: Conversation[];
  activeConvId: string | null;
  busy: boolean;
  setProvider: (p: AIProvider) => void;
  setApiKey: (k: string) => void;
  applyApiKey: (raw: string) => { ok: boolean; message: string };
  setBaseUrl: (u: string) => void;
  setModel: (m: string) => void;
  ensureActiveConv: () => string;
  newConversation: () => string;
  setActiveConv: (id: string) => void;
  deleteConversation: (id: string) => void;
  togglePin: (id: string) => void;
  addMessage: (role: ChatMessage['role'], content: string, attachedPaths?: string[]) => void;
  clearActiveMessages: () => void;
  setBusy: (b: boolean) => void;
  getActiveMessages: () => ChatMessage[];
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      provider: 'groq',
      apiKey: '',
      baseUrl: DEFAULTS.groq.baseUrl,
      model: DEFAULTS.groq.model,
      lastDetectLabel: '',
      conversations: [],
      activeConvId: null,
      busy: false,

      setProvider: (provider) => {
        const d = DEFAULTS[provider];
        set({
          provider,
          baseUrl: d.baseUrl || get().baseUrl,
          model: d.model,
          lastDetectLabel: provider,
        });
      },
      setApiKey: (apiKey) => set({ apiKey }),
      applyApiKey: (raw) => {
        const key = raw.trim().replace(/^["']|["']$/g, '');
        if (!key) {
          set({ apiKey: '' });
          return { ok: false, message: 'Key trống' };
        }
        const detected = detectProviderFromKey(key);
        if (detected) {
          set({
            apiKey: key,
            provider: detected.provider,
            baseUrl: detected.baseUrl,
            model: detected.model,
            lastDetectLabel: detected.label,
          });
          return {
            ok: true,
            message: `✓ ${detected.label} · model ${detected.model} · URL đã điền`,
          };
        }
        // van luu key — user chon provider tay
        set({ apiKey: key, lastDetectLabel: 'Custom / chưa rõ' });
        return {
          ok: true,
          message: 'Đã lưu key · chọn Nhà cung cấp + Model bên dưới',
        };
      },
      setBaseUrl: (baseUrl) => set({ baseUrl: baseUrl.replace(/\/$/, '') }),
      setModel: (model) => set({ model }),

      ensureActiveConv: () => {
        const s = get();
        if (s.activeConvId && s.conversations.some((c) => c.id === s.activeConvId)) {
          return s.activeConvId;
        }
        if (s.conversations.length) {
          const id = s.conversations[0].id;
          set({ activeConvId: id });
          return id;
        }
        const id = uid('conv');
        set({
          conversations: [
            { id, title: 'Chat mới', pinned: false, messages: [], updatedAt: Date.now() },
          ],
          activeConvId: id,
        });
        return id;
      },

      newConversation: () => {
        const id = uid('conv');
        set((s) => ({
          conversations: [
            { id, title: 'Chat mới', pinned: false, messages: [], updatedAt: Date.now() },
            ...s.conversations,
          ],
          activeConvId: id,
        }));
        return id;
      },

      setActiveConv: (id) => set({ activeConvId: id }),

      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeConvId =
            s.activeConvId === id ? conversations[0]?.id || null : s.activeConvId;
          return { conversations, activeConvId };
        }),

      togglePin: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          ),
        })),

      addMessage: (role, content, attachedPaths) => {
        const convId = get().ensureActiveConv();
        const msg: ChatMessage = {
          id: uid('m'),
          role,
          content,
          at: Date.now(),
          attachedPaths,
        };
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== convId) return c;
            const messages = [...c.messages, msg].slice(-100);
            let title = c.title;
            if (c.title === 'Chat mới' && role === 'user') {
              title = content.slice(0, 36) + (content.length > 36 ? '…' : '');
            }
            return { ...c, messages, title, updatedAt: Date.now() };
          }),
        }));
        try {
          window.dispatchEvent(new CustomEvent('moihoccode:sync'));
        } catch {
          /* */
        }
      },

      clearActiveMessages: () => {
        const id = get().activeConvId;
        if (!id) return;
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, messages: [], title: 'Chat mới', updatedAt: Date.now() } : c
          ),
        }));
      },

      setBusy: (busy) => set({ busy }),

      getActiveMessages: () => {
        const s = get();
        return s.conversations.find((c) => c.id === s.activeConvId)?.messages || [];
      },
    }),
    {
      name: 'moihoccode-ai-config-v5',
      partialize: (s) => ({
        provider: s.provider,
        apiKey: s.apiKey,
        baseUrl: s.baseUrl,
        model: s.model,
        lastDetectLabel: s.lastDetectLabel,
        conversations: s.conversations,
        activeConvId: s.activeConvId,
      }),
    }
  )
);

function openaiMessages(
  system: string,
  history: { role: string; content: string }[],
  user: string
) {
  return [
    { role: 'system', content: system },
    ...history.filter((m) => m.role === 'user' || m.role === 'assistant'),
    { role: 'user', content: user },
  ];
}

async function callAnthropic(
  system: string,
  history: { role: string; content: string }[],
  user: string
): Promise<string> {
  const { apiKey, baseUrl, model } = useAIStore.getState();
  const msgs = [
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: user },
  ];
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system,
      messages: msgs,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = await res.json();
  const parts = data?.content;
  if (Array.isArray(parts)) {
    return parts.map((p: any) => p.text || '').join('') || '';
  }
  throw new Error('Anthropic không trả nội dung.');
}

export async function callAIChat(
  system: string,
  history: { role: string; content: string }[],
  user: string
): Promise<string> {
  const { apiKey, baseUrl, model, provider } = useAIStore.getState();
  if (!apiKey) throw new Error('Chưa có API Key. Bấm ⚙ để dán key.');
  if (!baseUrl && provider !== 'custom') throw new Error('Chưa có Base URL API.');

  if (provider === 'anthropic') {
    return callAnthropic(system, history, user);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] =
      typeof window !== 'undefined' ? window.location.origin : 'https://moihoccode.local';
    headers['X-Title'] = 'KiteHood AI Agent';
  }

  const base = (baseUrl || '').trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(base)) {
    throw new Error(
      'Base URL AI sai (phai la https://...). Vi du: https://api.openai.com/v1 hoac https://openrouter.ai/api/v1 — khong de trong hoac domain kitehood.'
    );
  }
  let url = `${base}/chat/completions`;
  // Google AI Studio OpenAI-compat sometimes needs key query
  if (provider === 'google' && /^AIza/i.test(apiKey)) {
    // Bearer works on openai-compat endpoint; keep both
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.45,
      max_tokens: 8192,
      messages: openaiMessages(system, history, user),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI API ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI không trả về nội dung.');
  return content as string;
}

export async function callAIChatStream(
  system: string,
  history: { role: string; content: string }[],
  user: string,
  onChunk: (text: string) => void
): Promise<string> {
  const { apiKey, baseUrl, model, provider } = useAIStore.getState();
  if (!apiKey) throw new Error('Chưa có API Key. Bấm ⚙ để dán key.');
  if (!baseUrl && provider !== 'custom') throw new Error('Chưa có Base URL API.');

  // Anthropic stream complex — fallback non-stream
  if (provider === 'anthropic') {
    const full = await callAnthropic(system, history, user);
    onChunk(full);
    return full;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] =
      typeof window !== 'undefined' ? window.location.origin : 'https://moihoccode.local';
    headers['X-Title'] = 'KiteHood AI Agent';
  }

  const baseS = (baseUrl || '').trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(baseS)) {
    throw new Error('Base URL AI sai — can https://...');
  }
  const url = `${baseS}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.5,
      max_tokens: 8192,
      stream: true,
      messages: openaiMessages(system, history, user),
    }),
  });

  if (!res.ok || !res.body) {
    return callAIChat(system, history, user);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const data = s.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const j = JSON.parse(data);
        const delta = j?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onChunk(full);
        }
      } catch {
        /* */
      }
    }
  }
  if (!full) return callAIChat(system, history, user);
  return full;
}

export const ALL_PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'google', label: 'Google AI Studio' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'groq', label: 'Groq' },
  { id: 'xai', label: 'xAI Grok' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'together', label: 'Together AI' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'fireworks', label: 'Fireworks' },
  { id: 'cohere', label: 'Cohere' },
  { id: 'custom', label: 'Custom (base URL)' },
];
