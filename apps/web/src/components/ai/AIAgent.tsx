import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, Send, Trash2, Settings2, Bug, Wrench, FilePlus2,
  Code2, Eye, Loader2, Copy, Check, Paperclip, X, Pin, Plus,
  MessageSquare, BookOpen, Lightbulb, Zap, RefreshCw, GraduationCap,
} from 'lucide-react';
import {
  useAIStore, callAIChat, callAIChatStream, AIProvider, PROVIDER_MODELS, ALL_PROVIDERS,
} from '../../stores/ai';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';

const QUICK = [
  { id: 'explain', icon: Eye, label: 'Giải thích', prompt: 'Giải thích rõ ràng các file được gắn / đang mở (tiếng Việt, dễ hiểu).' },
  { id: 'bugs', icon: Bug, label: 'Tìm lỗi', prompt: 'Tìm bug/lỗi trong file gắn. Liệt kê mức độ nghiêm trọng + cách sửa.' },
  { id: 'fix', icon: Wrench, label: 'Sửa lỗi', prompt: 'Sửa lỗi file gắn. Mỗi file:\nFILE: ten.ext\n```lang\nfull code\n```' },
  { id: 'improve', icon: Code2, label: 'Cải thiện', prompt: 'Cải thiện code (đọc, performance, best practice). Trả FILE: name + block ``` full.' },
  { id: 'teach', icon: GraduationCap, label: 'Dạy bài', prompt: 'Hãy dạy tôi khái niệm liên quan file đang mở: lý thuyết dễ hiểu + ví dụ ngắn + lỗi hay gặp.' },
  { id: 'quiz', icon: Lightbulb, label: 'Đố vui', prompt: 'Đặt 3 câu hỏi trắc nghiệm ngắn về kiến thức trong file/context. Đáp án để cuối.' },
  { id: 'gen', icon: Sparkles, label: 'Viết code…', prompt: '' },
  { id: 'file', icon: FilePlus2, label: 'Tạo file…', prompt: '' },
];

const SYSTEM = `Bạn là trợ lý AI thông minh trong IDE "KiteHood" (vừa ChatGPT vừa giáo viên code).
Trả lời MỌI câu hỏi: đời thường, học tập, toán, ngoại ngữ, lập trình…
- Tiếng Việt rõ ràng, thân thiện, có cấu trúc.
- KHÔNG ép nhắc bài tập trừ khi user nhờ dạy / học.
- Khi sửa/tạo code: dùng định dạng:
FILE: ten-file.ext
\`\`\`lang
toàn bộ nội dung file
\`\`\`
- Giải thích ngắn sau code khi hữu ích.`;

function extractFileBlocks(text: string) {
  const out: { name?: string; lang: string; code: string }[] = [];
  const re = /(?:FILE:\s*([^\n\s]+)\s*)?```(\w+)?\n([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push({ name: m[1], lang: (m[2] || 'txt').toLowerCase(), code: m[3].replace(/\n$/, '') });
  }
  return out;
}

function MarkdownLite({ text }: { text: string }) {
  // Lightweight render: code blocks + inline `code` + newlines
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const m = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          const code = m ? m[2] : part.replace(/```/g, '');
          const lang = m?.[1] || '';
          return (
            <pre
              key={i}
              className="my-2 p-2.5 rounded-xl overflow-x-auto text-[12px] font-mono"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border)',
              }}
            >
              {lang && (
                <div className="text-[10px] uppercase opacity-50 mb-1 tracking-wider">{lang}</div>
              )}
              {code}
            </pre>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export function AIAgent() {
  const store = useAIStore();
  const {
    provider, apiKey, baseUrl, model, busy, lastDetectLabel,
    conversations, activeConvId,
    setProvider, applyApiKey, setApiKey, setBaseUrl, setModel,
    addMessage, clearActiveMessages, setBusy,
    ensureActiveConv, newConversation, setActiveConv, deleteConversation, togglePin,
    getActiveMessages,
  } = store;
  const { nodes, updateContent, createFile, getPath } = useFSStore();
  const { activeTabId, tabs, openTab } = useEditorStore();
  const [input, setInput] = useState('');
  const [showCfg, setShowCfg] = useState(!apiKey);
  const [showModel, setShowModel] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [attachedIds, setAttachedIds] = useState<string[]>([]);
  const [detectMsg, setDetectMsg] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [streamText, setStreamText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ensureActiveConv();
  }, []);

  const messages = getActiveMessages();
  const models = PROVIDER_MODELS[provider] || [];
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeNode = activeTab ? nodes[activeTab.fileId] : null;

  const fileList = useMemo(
    () =>
      Object.values(nodes)
        .filter((n) => n.type === 'file')
        .map((n) => ({ id: n.id, path: getPath(n.id) || n.name, name: n.name })),
    [nodes, getPath]
  );

  const sortedConv = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      }),
    [conversations]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy, streamText]);

  useEffect(() => {
    if (activeNode && attachedIds.length === 0) setAttachedIds([activeNode.id]);
  }, [activeNode?.id]);

  function buildContext(ids: string[]) {
    const useIds = ids.length ? ids : activeNode ? [activeNode.id] : [];
    return useIds
      .map((id) => {
        const n = nodes[id];
        if (!n || n.type !== 'file') return '';
        return `### FILE: ${getPath(n.id) || n.name}\n\`\`\`${n.language || ''}\n${(n.content || '').slice(0, 14000)}\n\`\`\``;
      })
      .filter(Boolean)
      .join('\n\n');
  }

  async function run(userText: string) {
    const text = userText.trim();
    if (!text || busy) return;
    const paths = attachedIds
      .map((id) => nodes[id] && (getPath(id) || nodes[id].name))
      .filter(Boolean) as string[];
    addMessage('user', text, paths);
    setInput('');
    setBusy(true);
    setStreamText('');
    try {
      const history = getActiveMessages()
        .slice(-24)
        .map((m) => ({ role: m.role, content: m.content }));
      const codeLike =
        attachedIds.length > 0 ||
        /code|file|lỗi|bug|sửa|html|css|js|function|debug|hàm|python|java/i.test(text);
      const payload = text + (codeLike ? `\n\n==== FILES ====\n${buildContext(attachedIds)}` : '');

      let reply = '';
      try {
        reply = await callAIChatStream(SYSTEM, history, payload, (partial) => {
          setStreamText(partial);
        });
      } catch {
        reply = await callAIChat(SYSTEM, history, payload);
      }
      setStreamText('');
      addMessage('assistant', reply);
    } catch (e: any) {
      setStreamText('');
      addMessage('assistant', `⚠️ ${e?.message || String(e)}`);
      setShowCfg(true);
    } finally {
      setBusy(false);
    }
  }

  function applyBlocks(content: string) {
    const blocks = extractFileBlocks(content);
    if (!blocks.length) {
      alert('Không tìm thấy code block (FILE: name + ```)');
      return;
    }
    let n = 0;
    for (const b of blocks) {
      if (b.name) {
        const existing = Object.values(nodes).find(
          (node) =>
            node.type === 'file' &&
            (node.name === b.name || getPath(node.id).endsWith('/' + b.name))
        );
        const lang =
          b.lang === 'js' || b.lang === 'javascript'
            ? 'javascript'
            : b.lang === 'ts'
              ? 'typescript'
              : b.lang === 'py'
                ? 'python'
                : b.lang;
        if (existing) {
          updateContent(existing.id, b.code);
          openTab(existing.id);
        } else {
          const id = createFile(b.name.split('/').pop() || b.name, null, b.code, lang);
          openTab(id);
        }
        n++;
      } else if (activeNode) {
        updateContent(activeNode.id, b.code);
        n++;
      }
    }
    if (n) {
      try {
        window.dispatchEvent(new CustomEvent('moihoccode:sync'));
      } catch {
        /* */
      }
    }
  }

  function copyText(id: string, text: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="flex flex-col h-full text-[13px]" style={{ background: 'transparent' }}>
      {/* Header */}
      <div
        className="px-3 py-2.5 border-b flex items-center gap-1.5 shrink-0"
        style={{
          borderColor: 'var(--border)',
          background: 'linear-gradient(135deg, var(--accent-muted), transparent)',
        }}
      >
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent-hover)))',
            boxShadow: '0 4px 14px var(--accent-glow)',
          }}
        >
          <Sparkles size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold tracking-wide">AI Agent</div>
          <div className="text-[10px] opacity-60 truncate">
            {apiKey ? `${provider} · ${model}` : 'Dán API key để bắt đầu'}
          </div>
        </div>
        <button className="icon-btn" title="Lịch sử" onClick={() => setShowChats((v) => !v)}>
          <MessageSquare size={14} />
        </button>
        <button className="icon-btn" title="Chat mới" onClick={() => newConversation()}>
          <Plus size={14} />
        </button>
        <button
          className="icon-btn"
          title="Cấu hình API"
          onClick={() => setShowCfg((v) => !v)}
          style={{ color: showCfg ? 'var(--accent)' : undefined }}
        >
          <Settings2 size={14} />
        </button>
        <button className="icon-btn" title="Xóa chat" onClick={() => clearActiveMessages()}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Conversation list */}
      {showChats && (
        <div
          className="border-b max-h-44 overflow-auto p-1.5 animate-fade-up"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}
        >
          {sortedConv.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[12px] cursor-pointer transition-colors"
              style={{
                background: c.id === activeConvId ? 'var(--accent-muted)' : 'transparent',
              }}
              onClick={() => {
                setActiveConv(c.id);
                setShowChats(false);
              }}
            >
              {c.pinned && <Pin size={10} className="text-amber-400 shrink-0" />}
              <span className="flex-1 truncate">{c.title}</span>
              <span className="text-[10px] opacity-40">{c.messages.length}</span>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(c.id);
                }}
              >
                <Pin size={11} />
              </button>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(c.id);
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {!sortedConv.length && <p className="text-[11px] opacity-50 p-2">Chưa có hội thoại</p>}
        </div>
      )}

      {/* Model bar */}
      <div className="border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <button
          className="w-full px-3 py-1.5 flex items-center gap-2 text-[11px]"
          onClick={() => setShowModel((v) => !v)}
          style={{ background: 'var(--hover)' }}
        >
          <span
            className="px-1.5 py-0.5 rounded-md font-semibold uppercase text-[10px]"
            style={{
              background: apiKey ? 'rgba(34,197,94,0.2)' : 'var(--bg-tertiary)',
              color: apiKey ? '#4ade80' : undefined,
            }}
          >
            {apiKey ? `● ${provider}` : '○ offline'}
          </span>
          <span className="flex-1 text-left truncate opacity-80">{model}</span>
          <span className="opacity-40 text-[10px]">{showModel ? '▲' : '▼'}</span>
        </button>
        {showModel && (
          <div className="p-2 flex flex-wrap gap-2" style={{ background: 'var(--bg-tertiary)' }}>
            <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="w-full px-2 py-1 text-xs rounded-lg"
              >
                {ALL_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg flex-1"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* API config — auto-detect provider + model khi dán key */}
      {showCfg && (
        <div
          className="p-3 border-b space-y-2.5 animate-fade-up"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}
        >
          <div className="text-[11px] font-semibold opacity-70">
            API Key — dán vào là tự nhận nhà cung cấp + model mặc định
          </div>
          <input
            type="password"
            placeholder="dán key: gsk_ | sk-or- | sk- | sk-ant- | xai- | AIza | pplx- | fw_"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg font-mono"
            value={apiKey}
            onChange={(e) => {
              const v = e.target.value;
              // luôn cập nhật key; đủ dài thì auto-detect
              if (v.trim().length >= 10) {
                const r = applyApiKey(v);
                setDetectMsg(r.message);
                if (r.ok) setShowModel(true);
              } else {
                setApiKey(v);
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text && text.trim().length > 8) {
                e.preventDefault();
                const r = applyApiKey(text);
                setDetectMsg(r.message);
                setShowModel(true);
              }
            }}
            onBlur={(e) => {
              if (e.target.value.trim()) {
                const r = applyApiKey(e.target.value);
                setDetectMsg(r.message);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const r = applyApiKey((e.target as HTMLInputElement).value);
                setDetectMsg(r.message);
                setShowModel(true);
              }
            }}
          />
          {/* Detected badge */}
          {apiKey && (
            <div
              className="flex flex-wrap items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg"
              style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                ✓ Đã nhận diện
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-black/20 uppercase text-[10px]">
                {lastDetectLabel || provider}
              </span>
              <span className="opacity-70">→</span>
              <span className="font-mono text-[10px] truncate max-w-[180px]">{model}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] opacity-50 mb-0.5">Nhà cung cấp</div>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="w-full px-2 py-1 text-xs rounded-lg"
              >
                {ALL_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] opacity-50 mb-0.5">Model</div>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Hoặc gõ model id tùy chỉnh…"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg font-mono"
          />
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Base URL (tự điền khi nhận diện key)"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg font-mono"
          />
          {detectMsg && (
            <p className="text-[11px]" style={{ color: 'var(--accent)' }}>
              {detectMsg}
            </p>
          )}
          <p className="text-[10px] opacity-50 leading-relaxed">
            Prefix: <b>sk-</b>OpenAI · <b>AIza</b>Google · <b>sk-ant-</b>Anthropic · <b>gsk_</b>Groq ·
            <b>sk-or-</b>OpenRouter · <b>xai-</b>xAI · <b>pplx-</b>Perplexity · <b>fw_</b>Fireworks.
            Dán key → tự điền provider + model + URL. Có thể đổi model sau.
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-2 py-1.5 flex flex-wrap gap-1 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        {QUICK.map((q) => (
          <button
            key={q.id}
            className="btn-glass flex items-center gap-1 px-2 py-1 text-[10px] rounded-full"
            disabled={busy}
            onClick={() => {
              if (q.prompt) run(q.prompt);
              else if (q.id === 'gen') {
                const t = prompt('Mô tả code cần viết:');
                if (t) run(`Viết code: ${t}\nTrả FILE: name + \`\`\` full.`);
              } else if (q.id === 'file') {
                const t = prompt('Tạo file gì? (vd: component navbar HTML)');
                if (t) run(`Tạo file mới: ${t}\nTrả FILE: ten.ext + \`\`\` full.`);
              }
            }}
          >
            <q.icon size={11} /> {q.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {!messages.length && !streamText && (
          <div className="text-center py-8 opacity-60 space-y-2">
            <Zap size={28} className="mx-auto text-[var(--accent)]" />
            <p className="text-sm font-medium">Hỏi gì cũng được</p>
            <p className="text-[11px] max-w-[240px] mx-auto">
              Giải thích code, sửa bug, dạy bài, đố vui, hoặc chat thường ngày.
              Gắn file bằng 📎 để AI đọc context.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[92%] rounded-2xl px-3 py-2"
              style={{
                background:
                  m.role === 'user'
                    ? 'linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent-hover)))'
                    : 'var(--bg-tertiary)',
                color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                boxShadow: m.role === 'user' ? '0 4px 16px var(--accent-glow)' : undefined,
              }}
            >
              {m.attachedPaths?.length ? (
                <div className="text-[10px] opacity-70 mb-1 flex flex-wrap gap-1">
                  {m.attachedPaths.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded-md bg-black/20">
                      {p}
                    </span>
                  ))}
                </div>
              ) : null}
              {m.role === 'assistant' ? <MarkdownLite text={m.content} /> : <div className="whitespace-pre-wrap">{m.content}</div>}
              {m.role === 'assistant' && (
                <div className="flex gap-1 mt-2 pt-1 border-t border-white/10">
                  <button
                    className="text-[10px] px-1.5 py-0.5 rounded-md hover:bg-white/10 flex items-center gap-0.5"
                    onClick={() => copyText(m.id, m.content)}
                  >
                    {copied === m.id ? <Check size={10} /> : <Copy size={10} />} Copy
                  </button>
                  {extractFileBlocks(m.content).length > 0 && (
                    <button
                      className="text-[10px] px-1.5 py-0.5 rounded-md hover:bg-white/10 flex items-center gap-0.5"
                      style={{ color: 'var(--accent)' }}
                      onClick={() => applyBlocks(m.content)}
                    >
                      <FilePlus2 size={10} /> Áp dụng code
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {streamText && (
          <div className="flex justify-start">
            <div
              className="max-w-[92%] rounded-2xl px-3 py-2"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
            >
              <MarkdownLite text={streamText} />
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[var(--accent)] animate-pulse rounded-sm" />
            </div>
          </div>
        )}
        {busy && !streamText && (
          <div className="flex items-center gap-2 text-[11px] opacity-60">
            <Loader2 size={14} className="animate-spin text-[var(--accent)]" /> AI đang nghĩ…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Attach bar */}
      {showAttach && (
        <div
          className="border-t max-h-28 overflow-auto p-2"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}
        >
          {fileList.map((f) => {
            const on = attachedIds.includes(f.id);
            return (
              <label key={f.id} className="flex items-center gap-2 px-1 py-0.5 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    setAttachedIds((ids) =>
                      on ? ids.filter((x) => x !== f.id) : [...ids, f.id]
                    )
                  }
                />
                <span className="truncate">{f.path}</span>
              </label>
            );
          })}
          {!fileList.length && <p className="text-[11px] opacity-50">Chưa có file</p>}
        </div>
      )}

      {/* Input */}
      <div className="p-2 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
        {attachedIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {attachedIds.map((id) => (
              <span
                key={id}
                className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
              >
                {nodes[id]?.name || id}
                <button onClick={() => setAttachedIds((a) => a.filter((x) => x !== id))}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-1.5 items-end">
          <button
            className="icon-btn shrink-0"
            title="Gắn file"
            onClick={() => setShowAttach((v) => !v)}
            style={{ color: showAttach ? 'var(--accent)' : undefined }}
          >
            <Paperclip size={16} />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                run(input);
              }
            }}
            rows={2}
            placeholder="Hỏi AI… (Enter gửi · Shift+Enter xuống dòng)"
            className="flex-1 px-3 py-2 text-[13px] rounded-xl resize-none outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
            }}
            disabled={busy}
          />
          <button
            className="btn-accent p-2.5 rounded-xl shrink-0"
            disabled={busy || !input.trim()}
            onClick={() => run(input)}
            title="Gửi"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
