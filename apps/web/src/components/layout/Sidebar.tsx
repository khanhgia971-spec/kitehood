import { X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ApiSettings } from '../settings/ApiSettings';
import { UserDashboard } from '../dashboard/UserDashboard';
import { Explorer } from '../explorer/Explorer';
import { LangDocs } from '../docs/LangDocs';
import { AIAgent } from '../ai/AIAgent';
import { LearnPanel } from '../learn/LearnPanel';
import { SearchPanel as SearchPanelView } from '../search/SearchPanel';
import { PrefsPanel } from '../settings/PrefsPanel';
import { FunPanel } from '../fun/FunPanel';
import { MusicPanel } from '../music/MusicPanel';
import { SnippetsPanel } from '../snippets/SnippetsPanel';

interface Props {
  view: string;
  onClose: () => void;
}

const WIDTH_KEY = 'moihoccode-sidebar-width';

export function Sidebar({ view, onClose }: Props) {
  const titleMap: Record<string, string> = {
    explorer: 'Explorer',
    search: 'Search',
    scm: 'Snippets',
    run: 'Run & Debug',
    extensions: 'Đố vui',
    dashboard: 'Dashboard',
    settings: 'Settings',
    docs: 'Language Docs',
    ai: 'AI Agent',
    learn: 'Học tập',
  };

  const isWideDefault = view === 'settings' || view === 'dashboard' || view === 'ai' || view === 'docs' || view === 'learn';
  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(WIDTH_KEY);
      if (saved) return Math.min(720, Math.max(260, Number(saved)));
    } catch { /* */ }
    return isWideDefault ? 420 : 280;
  });
  const dragging = useRef(false);

  useEffect(() => {
    // When switching to AI, prefer a wider panel if still default-ish
    if (view === 'ai' && width < 360) setWidth(420);
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch { /* */ }
  }, [width]);

  const onMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    // sidebar starts after activity bar (~48px)
    const next = Math.min(720, Math.max(260, e.clientX - 48));
    setWidth(next);
  }, []);

  useEffect(() => {
    const up = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', up);
    };
  }, [onMove]);

  return (
    <div
      className="flex flex-col shrink-0 h-full relative"
      style={{
        width,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div
        className="h-9 flex items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider shrink-0"
        style={{
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span>{titleMap[view] || view}</span>
        <button onClick={onClose} className="icon-btn">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
        <div key={view} className="sidebar-liquid-enter h-full overflow-auto">
          {view === 'explorer' && <Explorer />}
          {view === 'docs' && <LangDocs />}
          {view === 'ai' && <AIAgent />}
          {view === 'learn' && <LearnPanel />}
          {view === 'settings' && (
            <div className="h-full overflow-auto">
              <PrefsPanel />
              <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                <ApiSettings />
              </div>
            </div>
          )}
          {view === 'dashboard' && <UserDashboard />}
          {view === 'search' && <SearchPanelView />}
          {view === 'scm' && <SnippetsPanel />}
          {view === 'run' && (
            <div className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                Run & Debug
              </p>
              <p className="text-xs">Use the Run panel on the right or press F5.</p>
            </div>
          )}
          {view === 'extensions' && (
            <div className="flex flex-col h-full">
              <div className="flex border-b text-[11px]" style={{ borderColor: 'var(--border)' }}>
                <span className="px-3 py-1.5 opacity-70">Fun</span>
              </div>
              <div className="flex-1 min-h-0 overflow-auto"><FunPanel /></div>
              <div className="h-[42%] border-t min-h-0 overflow-auto" style={{ borderColor: 'var(--border)' }}>
                <MusicPanel />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag resize handle */}
      <div
        title="Kéo để đổi độ rộng"
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-20 hover:bg-[var(--accent)]/50"
        onMouseDown={(e) => {
          e.preventDefault();
          dragging.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
      />
    </div>
  );
}

