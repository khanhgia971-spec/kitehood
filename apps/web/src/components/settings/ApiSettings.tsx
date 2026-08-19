import { useState } from 'react';
import { useApiConfigStore } from '../../stores/apiConfig';
import { Check, AlertCircle, ClipboardPaste } from 'lucide-react';

export function ApiSettings() {
  const { baseUrl, apiKey, turnstileSiteKey, setBaseUrl, setApiKey, setTurnstileSiteKey, pasteAndApply } = useApiConfigStore();
  const [pasteText, setPasteText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handlePasteApply() {
    const res = pasteAndApply(pasteText);
    setMsg({ ok: res.ok, text: res.message });
    if (res.ok) setPasteText('');
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="p-5 space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold mb-1">API Configuration</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Paste API URL / key → tự động cập nhật. Hỗ trợ JSON hoặc dạng key=value.
        </p>
      </div>

      {/* Paste zone */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
          <ClipboardPaste size={13} /> Paste API config
        </label>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder={`Dán vào đây, ví dụ:\nhttps://api.example.com\n\nhoặc:\n{\n  "baseUrl": "https://api.example.com",\n  "apiKey": "your-jwt-or-key"\n}`}
          className="w-full h-28 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-[var(--accent)] resize-none"
        />
        <button
          onClick={handlePasteApply}
          disabled={!pasteText.trim()}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium disabled:opacity-40 transition-colors"
        >
          Apply pasted config
        </button>
        {msg && (
          <div className={`flex items-center gap-1.5 text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {msg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}
      </div>

      {/* Manual fields */}
      <div className="space-y-3 pt-2 border-t border-[var(--border)]">
        <div>
          <label className="text-xs text-[var(--text-secondary)]">Base URL</label>
          <input
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm outline-none focus:border-[var(--accent)]"
            placeholder="https://your-worker.workers.dev/api"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-secondary)]">API Key / JWT</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm outline-none focus:border-[var(--accent)]"
            placeholder="Bearer token hoặc API key"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-secondary)]">Turnstile Site Key</label>
          <input
            value={turnstileSiteKey}
            onChange={e => setTurnstileSiteKey(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm outline-none focus:border-[var(--accent)]"
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );
}
