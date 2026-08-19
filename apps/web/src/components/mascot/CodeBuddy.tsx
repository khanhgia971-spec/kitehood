import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Sparkles, Loader2 } from 'lucide-react';
import { useAIStore, callAIChat } from '../../stores/ai';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';

/**
 * Floating code buddy — original cute mascot (not a copyrighted character).
 * Draggable bubble + "Tôi không biết viết như nào?" helper.
 */
export function CodeBuddy() {
  const [pos, setPos] = useState({ x: 24, y: typeof window !== 'undefined' ? window.innerHeight - 160 : 400 });
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState('Kéo mình đi bất kỳ đâu! Cần giúp thì bấm nút nhé~');
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const apiKey = useAIStore((s) => s.apiKey);
  const nodes = useFSStore((s) => s.nodes);
  const updateContent = useFSStore((s) => s.updateContent);
  const { activeTabId, tabs } = useEditorStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeNode = activeTab ? nodes[activeTab.fileId] : null;

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return;
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 80, e.clientX - drag.current.dx)),
        y: Math.max(8, Math.min(window.innerHeight - 80, e.clientY - drag.current.dy)),
      });
    };
    const up = () => {
      drag.current = null;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  async function helpWrite() {
    if (!apiKey) {
      setBubble('Cần dán API key trong AI Agent trước nhé!');
      setOpen(true);
      return;
    }
    if (!activeNode) {
      setBubble('Hãy mở một file code trước đã~');
      setOpen(true);
      return;
    }
    setBusy(true);
    setOpen(true);
    setBubble('Đang nghĩ gợi ý cho bạn...');
    try {
      const reply = await callAIChat(
        `Bạn là trợ lý học code dễ thương. User bấm "Tôi không biết viết như nào?".
Gợi ý ngắn tiếng Việt, rồi đưa TOÀN BỘ code file đã hoàn thiện trong một block \`\`\`${activeNode.language || 'html'}
...code...\`\`\`
để apply vào editor.`,
        [],
        `File: ${activeNode.name}\nLanguage: ${activeNode.language}\nCode hiện tại:\n\`\`\`\n${activeNode.content || ''}\n\`\`\`\nHãy giúp hoàn thiện / viết tiếp.`
      );
      setBubble(reply.slice(0, 280) + (reply.length > 280 ? '…' : ''));
      const m = reply.match(/```(?:\w+)?\n([\s\S]*?)```/);
      if (m && activeNode) {
        updateContent(activeNode.id, m[1].replace(/\n$/, ''));
        setBubble((b) => b + '\n\n✅ Đã điền code vào file đang mở!');
      }
    } catch (e: any) {
      setBubble('Lỗi: ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed z-[99990] select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 w-64 p-3 rounded-2xl text-[12px] leading-relaxed shadow-xl"
          style={{
            background: 'var(--bg-float)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <button
            className="absolute top-1.5 right-1.5 icon-btn"
            onClick={() => setOpen(false)}
          >
            <X size={12} />
          </button>
          <div className="pr-5 whitespace-pre-wrap max-h-40 overflow-auto">
            {busy && <Loader2 size={14} className="inline animate-spin mr-1" />}
            {bubble}
          </div>
        </div>
      )}

      {/* Mascot face — original design */}
      <div
        className="relative cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        }}
        onClick={() => setOpen((v) => !v)}
        title="Kéo di chuyển · click mở chat"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center relative mascot-bob"
          style={{
            background: 'linear-gradient(145deg, #ffd4a8, #ffb38a)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.5)',
            border: '2px solid rgba(255,255,255,0.6)',
          }}
        >
          {/* eyes */}
          <span className="absolute w-2.5 h-2.5 bg-black rounded-full" style={{ left: 18, top: 24 }} />
          <span className="absolute w-2.5 h-2.5 bg-black rounded-full" style={{ right: 18, top: 24 }} />
          <span className="absolute w-1 h-1 bg-white rounded-full" style={{ left: 20, top: 25 }} />
          <span className="absolute w-1 h-1 bg-white rounded-full" style={{ right: 20, top: 25 }} />
          {/* blush */}
          <span className="absolute w-3 h-1.5 rounded-full opacity-50" style={{ left: 8, top: 34, background: '#ff8a8a' }} />
          <span className="absolute w-3 h-1.5 rounded-full opacity-50" style={{ right: 8, top: 34, background: '#ff8a8a' }} />
          {/* smile */}
          <span
            className="absolute"
            style={{
              bottom: 14,
              width: 14,
              height: 7,
              borderBottom: '2px solid #333',
              borderRadius: '0 0 14px 14px',
            }}
          />
          <Sparkles size={10} className="absolute -top-1 -right-1 text-amber-300" />
        </div>
      </div>

      <button
        className="mt-2 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium shadow-lg"
        style={{
          background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
          color: '#fff',
        }}
        onClick={(e) => {
          e.stopPropagation();
          helpWrite();
        }}
        disabled={busy}
      >
        <HelpCircle size={12} />
        Tôi không biết viết như nào?
      </button>
    </div>
  );
}
