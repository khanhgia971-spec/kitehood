import { useMemo, useState } from 'react';
import { Code2, Copy, Check, Search } from 'lucide-react';
import { SNIPPETS } from '../../data/snippets';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';

export function SnippetsPanel() {
  const [q, setQ] = useState('');
  const [lang, setLang] = useState('all');
  const [copied, setCopied] = useState<string | null>(null);
  const createFile = useFSStore((s) => s.createFile);
  const openTab = useEditorStore((s) => s.openTab);

  const langs = useMemo(
    () => ['all', ...Array.from(new Set(SNIPPETS.map((s) => s.lang)))],
    []
  );

  const list = useMemo(() => {
    return SNIPPETS.filter((s) => {
      if (lang !== 'all' && s.lang !== lang) return false;
      if (!q.trim()) return true;
      const k = q.toLowerCase();
      return s.title.toLowerCase().includes(k) || s.tags.some((t) => t.includes(k));
    });
  }, [q, lang]);

  function insert(s: (typeof SNIPPETS)[0]) {
    const ext: Record<string, string> = {
      python: 'py', cpp: 'cpp', c: 'c', java: 'java', javascript: 'js',
      go: 'go', rust: 'rs', html: 'html', sql: 'sql', bash: 'sh',
    };
    const id = createFile(
      `snippet-${s.id}.${ext[s.lang] || 'txt'}`,
      null,
      s.code,
      s.lang
    );
    openTab(id);
  }

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-3 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Snippets</span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tim snippet…"
            className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg"
          />
        </div>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="w-full px-2 py-1 text-xs rounded-lg"
        >
          {langs.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {list.map((s) => (
          <div
            key={s.id}
            className="p-2.5 rounded-xl border"
            style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md uppercase font-semibold"
                style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                {s.lang}
              </span>
              <span className="font-medium text-[12px] flex-1 truncate">{s.title}</span>
            </div>
            <pre className="text-[11px] opacity-70 overflow-x-auto max-h-20 mb-2 font-mono whitespace-pre-wrap">
              {s.code.slice(0, 180)}{s.code.length > 180 ? '…' : ''}
            </pre>
            <div className="flex gap-1">
              <button className="btn-accent text-[10px] px-2 py-1 rounded-lg" onClick={() => insert(s)}>
                Mo file
              </button>
              <button
                className="btn-glass text-[10px] px-2 py-1 rounded-lg flex items-center gap-1"
                onClick={() => {
                  navigator.clipboard?.writeText(s.code);
                  setCopied(s.id);
                  setTimeout(() => setCopied(null), 1200);
                }}
              >
                {copied === s.id ? <Check size={10} /> : <Copy size={10} />} Copy
              </button>
            </div>
          </div>
        ))}
        {!list.length && <p className="text-xs opacity-50 p-3">Khong co snippet</p>}
      </div>
    </div>
  );
}
