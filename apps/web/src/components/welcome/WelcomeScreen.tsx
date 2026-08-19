import { useState } from 'react';
import {
  Code2, BookOpen, Sparkles, Rocket, FolderOpen, X, Keyboard, Volume2,
} from 'lucide-react';
import { usePrefsStore } from '../../stores/prefs';
import { TEMPLATES } from '../../lib/templates';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';

type Props = {
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
};

export function WelcomeScreen({ onOpenTemplates, onOpenShortcuts }: Props) {
  const setShowWelcome = usePrefsStore((s) => s.setShowWelcome);
  const showWelcome = usePrefsStore((s) => s.showWelcome);
  const createFile = useFSStore((s) => s.createFile);
  const openTab = useEditorStore((s) => s.openTab);
  const [dontShow, setDontShow] = useState(false);

  if (!showWelcome) return null;

  function close() {
    if (dontShow) setShowWelcome(false);
    else setShowWelcome(false);
  }

  function quickStart() {
    const id = createFile(
      'hello.html',
      null,
      `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hello</title>
  <style>
    body {
      font-family: system-ui;
      display: grid;
      place-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0f172a, #312e81);
      color: white;
    }
  </style>
</head>
<body>
  <h1>Xin chào KiteHood! 🚀</h1>
</body>
</html>
`,
      'html'
    );
    openTab(id);
    setShowWelcome(false);
  }

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden glass-strong animate-fade-up"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      >
        <div
          className="px-6 pt-6 pb-4 relative"
          style={{
            background: 'linear-gradient(135deg, var(--accent-muted), transparent)',
          }}
        >
          <button className="icon-btn absolute top-3 right-3" onClick={close}>
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <Code2 size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold m-0">KiteHood</h1>
              <p className="text-xs m-0 opacity-70">IDE học lập trình ngay trên trình duyệt</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 grid gap-2 sm:grid-cols-2">
          <button
            className="btn-accent flex items-center gap-2 px-3 py-3 text-left text-sm rounded-xl"
            onClick={quickStart}
          >
            <Rocket size={18} />
            <div>
              <div className="font-semibold">Bắt đầu nhanh</div>
              <div className="text-[11px] opacity-80">Tạo hello.html mẫu</div>
            </div>
          </button>
          <button
            className="btn-glass flex items-center gap-2 px-3 py-3 text-left text-sm rounded-xl"
            onClick={() => {
              onOpenTemplates();
              setShowWelcome(false);
            }}
          >
            <FolderOpen size={18} />
            <div>
              <div className="font-semibold">Chọn template</div>
              <div className="text-[11px] opacity-80">{TEMPLATES.length} mẫu dự án</div>
            </div>
          </button>
          <button
            className="btn-glass flex items-center gap-2 px-3 py-3 text-left text-sm rounded-xl"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('mhc:view', { detail: 'learn' }));
              setShowWelcome(false);
            }}
          >
            <BookOpen size={18} />
            <div>
              <div className="font-semibold">Lộ trình học</div>
              <div className="text-[11px] opacity-80">Bài tập + AI chấm + XP</div>
            </div>
          </button>
          <button
            className="btn-glass flex items-center gap-2 px-3 py-3 text-left text-sm rounded-xl"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('mhc:view', { detail: 'ai' }));
              setShowWelcome(false);
            }}
          >
            <Sparkles size={18} />
            <div>
              <div className="font-semibold">AI Agent</div>
              <div className="text-[11px] opacity-80">Dán API key → hỏi code</div>
            </div>
          </button>
        </div>

        <div className="px-6 pb-5 flex flex-wrap items-center gap-3 text-[11px] opacity-70">
          <button className="flex items-center gap-1 hover:opacity-100" onClick={onOpenShortcuts}>
            <Keyboard size={12} /> Phím tắt
          </button>
          <span className="flex items-center gap-1">
            <Volume2 size={12} /> Tiếng gõ phím cơ (bật trong Settings)
          </span>
          <label className="ml-auto flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
            Không hiện lại
          </label>
        </div>
      </div>
    </div>
  );
}
