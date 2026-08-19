import { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { EditorArea } from '../editor/EditorArea';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { RunPanel } from '../run/RunPanel';
import { LivePreview } from '../preview/LivePreview';
import { TerminalPanel } from '../terminal/Terminal';
import { SaveDialog } from '../save/SaveDialog';
import { CodeBuddy } from '../mascot/CodeBuddy';
import { CloudSyncButton } from './CloudSyncButton';
import { scheduleCloudPush, pullFromCloud } from '../../lib/cloudSync';
import { usePreviewStore } from '../../stores/preview';
import { useAuthStore } from '../../stores/auth';
import { useEditorStore } from '../../stores/editor';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, Save, LayoutTemplate, Keyboard } from 'lucide-react';
import { WelcomeScreen } from '../welcome/WelcomeScreen';
import { TemplatePicker } from '../templates/TemplatePicker';
import { ShortcutsModal } from '../shortcuts/ShortcutsModal';
import { attachGlobalKeyboardSound, setKeyboardSoundEnabled, setKeyboardVolume } from '../../lib/keyboardSound';
import { usePrefsStore } from '../../stores/prefs';


type View = 'explorer' | 'search' | 'scm' | 'run' | 'extensions' | 'dashboard' | 'settings' | 'docs' | 'ai' | 'learn';

export function IDELayout() {
  const [activeView, setActiveView] = useState<View>('explorer');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [panelVisible, setPanelVisible] = useState(false); // terminal off — nhe nhu OneCompiler
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [previewWidth, setPreviewWidth] = useState(380);
  const [runWidth, setRunWidth] = useState(360);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [runPanelVisible, setRunPanelVisible] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const theme = usePrefsStore((s) => s.theme);
  const setTheme = usePrefsStore((s) => s.setTheme);
  const showMascot = usePrefsStore((s) => s.showMascot);
  const previewOpen = usePreviewStore((s) => s.open);
  const defaultFileId = usePreviewStore((s) => s.defaultFileId);
  const setPreviewOpen = usePreviewStore((s) => s.setOpen);
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const dragKind = useRef<'term' | 'preview' | 'run' | null>(null);

  
  // Mo tab mac dinh khi vao lai web
  useEffect(() => {
    if (!defaultFileId) return;
    try {
      const { openTab } = useEditorStore.getState();
      const { nodes } = useFSStore.getState();
      if (nodes[defaultFileId]) openTab(defaultFileId);
    } catch { /* */ }
  }, [defaultFileId]);
useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    attachGlobalKeyboardSound();
    const prefs = usePrefsStore.getState();
    setKeyboardSoundEnabled(false); // no key sound
    setKeyboardVolume(prefs.keyboardVolume);
  }, []);

  useEffect(() => {
    const onView = (e: Event) => {
      const v = (e as CustomEvent).detail as View;
      if (v) {
        setActiveView(v);
        setSidebarVisible(true);
      }
    };
    window.addEventListener('mhc:view', onView);
    const onTpl = () => setTemplatesOpen(true);
    const onSc = () => setShortcutsOpen(true);
    window.addEventListener('mhc:templates', onTpl);
    window.addEventListener('mhc:shortcuts', onSc);
    return () => {
      window.removeEventListener('mhc:view', onView);
      window.removeEventListener('mhc:templates', onTpl);
      window.removeEventListener('mhc:shortcuts', onSc);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    pullFromCloud().catch(() => {});
    const onChange = () => scheduleCloudPush();
    window.addEventListener('fs:imported', onChange);
    window.addEventListener('moihoccode:sync', onChange);
    const id = window.setInterval(() => scheduleCloudPush(0), 120000);
    return () => {
      window.removeEventListener('fs:imported', onChange);
      window.removeEventListener('moihoccode:sync', onChange);
      window.clearInterval(id);
    };
  }, [token]);

  useEffect(() => {
    const onDel = (e: Event) => {
      const ids = (e as CustomEvent).detail as string[];
      useEditorStore.getState().pruneDeleted(ids);
    };
    const onReset = () => useEditorStore.getState().closeAll();
    window.addEventListener('fs:deleted', onDel);
    window.addEventListener('fs:reset', onReset);
    return () => {
      window.removeEventListener('fs:deleted', onDel);
      window.removeEventListener('fs:reset', onReset);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarVisible((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        setPanelVisible((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSaveOpen(true);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragKind.current) return;
      if (dragKind.current === 'term') {
        const h = Math.min(Math.max(window.innerHeight - e.clientY - 28, 80), 500);
        setTerminalHeight(h);
      } else if (dragKind.current === 'preview') {
        const w = Math.min(Math.max(window.innerWidth - e.clientX, 240), 800);
        setPreviewWidth(w);
      } else if (dragKind.current === 'run') {
        const w = Math.min(
          Math.max(window.innerWidth - e.clientX - (previewOpen ? previewWidth : 0), 220),
          560
        );
        setRunWidth(w);
      }
    },
    [previewOpen, previewWidth]
  );

  useEffect(() => {
    const up = () => {
      dragKind.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', up);
    };
  }, [onMouseMove]);

  return (
    <div className="flex flex-col h-full w-full" data-theme={theme} style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="h-12 flex items-center gap-2.5 px-4 shrink-0 glass-header"
        style={{ zIndex: 20 }}
      >
        <span className="brand-text text-sm">KiteHood</span>
        <button
          onClick={() => setSaveOpen(true)}
          className="btn-glass flex items-center gap-1.5 px-2.5 py-1 text-xs"
          title="Save (Ctrl+S)"
        >
          <Save size={13} /> Save
        </button>
        <button
          onClick={() => setTemplatesOpen(true)}
          className="btn-glass flex items-center gap-1.5 px-2.5 py-1 text-xs"
          title="Mẫu dự án"
        >
          <LayoutTemplate size={13} /> Templates
        </button>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="btn-glass flex items-center gap-1 px-2 py-1 text-xs"
          title="Phím tắt"
        >
          <Keyboard size={13} />
        </button>
        <CloudSyncButton />
        <div className="flex-1" />
        {token && user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <User size={14} />
              {user.username || user.email}
            </span>
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-2 py-1 rounded-md text-xs border"
                style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#fbbf24',
                  borderColor: 'rgba(251, 191, 36, 0.3)',
                }}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn-glass flex items-center gap-1 px-2.5 py-1 text-xs"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="btn-accent flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
          >
            <LogIn size={13} /> Login
          </button>
        )}
      </header>

      {/* Main row */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <ActivityBar
          active={activeView}
          onChange={(id) => {
            setActiveView(id as View);
            setSidebarVisible(true);
            if (id === 'run') setRunPanelVisible(true);
          }}
        />
        {sidebarVisible && (
          <Sidebar view={activeView} onClose={() => setSidebarVisible(false)} />
        )}

        <div className="flex flex-col flex-1 min-w-0 min-h-0" style={{ background: 'var(--bg-primary)' }}>
          <EditorArea />
          {panelVisible && (
            <>
              <div
                className="h-1 cursor-row-resize shrink-0 transition-colors"
                style={{ background: 'var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--border)')}
                onMouseDown={() => {
                  dragKind.current = 'term';
                }}
              />
              <div
                style={{ height: terminalHeight, borderTop: '1px solid var(--border)' }}
                className="shrink-0"
              >
                <TerminalPanel />
              </div>
            </>
          )}
        </div>

        {runPanelVisible && (
          <>
            <div
              className="w-1 cursor-col-resize shrink-0"
              style={{ background: 'var(--border)' }}
              onMouseDown={() => {
                dragKind.current = 'run';
              }}
            />
            <div style={{ width: runWidth }} className="shrink-0 overflow-hidden">
              <RunPanel />
            </div>
          </>
        )}

        {previewOpen && (
          <>
            <div
              className="w-1 cursor-col-resize shrink-0"
              style={{ background: 'var(--border)' }}
              onMouseDown={() => {
                dragKind.current = 'preview';
              }}
            />
            <div style={{ width: previewWidth }} className="shrink-0 overflow-hidden">
              <LivePreview />
            </div>
          </>
        )}
      </div>

      <StatusBar
        theme={theme}
        onThemeChange={setTheme}
        onTogglePreview={() => setPreviewOpen(!previewOpen)}
        onToggleRun={() => setRunPanelVisible((v) => !v)}
        onToggleTerminal={() => setPanelVisible((v) => !v)}
      />

      {commandPaletteOpen && <CommandPalette onClose={() => setCommandPaletteOpen(false)} />}
      {saveOpen && <SaveDialog onClose={() => setSaveOpen(false)} />}
      {templatesOpen && <TemplatePicker onClose={() => setTemplatesOpen(false)} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      <WelcomeScreen
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      {showMascot && <CodeBuddy />}
    </div>
  );
}
