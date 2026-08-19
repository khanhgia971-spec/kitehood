import {
  setKeyboardSoundEnabled,
  setKeyboardVolume as setKbVolLib,
  playKeySound,
} from '../../lib/keyboardSound';
import { usePrefsStore, ThemeId } from '../../stores/prefs';
import { Monitor, Type, Volume2, MousePointer2, Sparkles, RotateCcw } from 'lucide-react';

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'white', label: 'White' },
  { id: 'milk-white', label: 'Milk White' },
];

export function PrefsPanel() {
  const {
    theme,
    fontSize,
    tabSize,
    wordWrap,
    minimap,
    lineNumbers,
    keyboardSound,
    keyboardVolume,
    cursorStyle,
    showMascot,
    showWelcome,
    setTheme,
    setFontSize,
    setTabSize,
    setWordWrap,
    setMinimap,
    setLineNumbers,
    setKeyboardSound,
    setKeyboardVolume,
    setCursorStyle,
    setShowMascot,
    setShowWelcome,
    resetPrefs,
  } = usePrefsStore();

  return (
    <div className="p-4 space-y-5 max-w-xl text-[13px]">
      <div>
        <h2 className="text-base font-semibold mb-0.5 flex items-center gap-2">
          <Monitor size={16} className="text-[var(--accent)]" /> Giao diện
        </h2>
        <p className="text-[11px] opacity-60">Liquid Glass · theme · editor</p>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wider opacity-60 mb-1.5">Theme</div>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={theme === t.id ? 'btn-accent px-3 py-1.5 text-xs' : 'btn-glass px-3 py-1.5 text-xs'}
              onClick={() => setTheme(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] uppercase tracking-wider opacity-60 flex items-center gap-1">
          <Type size={12} /> Editor
        </div>
        <label className="flex items-center justify-between gap-3">
          <span>Cỡ chữ</span>
          <input
            type="range"
            min={10}
            max={22}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 max-w-[140px]"
          />
          <span className="w-8 text-right font-mono text-xs">{fontSize}</span>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>Tab size</span>
          <select
            value={tabSize}
            onChange={(e) => setTabSize(Number(e.target.value))}
            className="px-2 py-1 rounded text-xs"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
          >
            {[2, 4, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ['Word wrap', wordWrap, setWordWrap],
            ['Minimap', minimap, setMinimap],
            ['Line numbers', lineNumbers, setLineNumbers],
          ] as const
        ).map(([label, val, set]) => (
          <label key={label} className="flex items-center justify-between cursor-pointer">
            <span>{label}</span>
            <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} />
          </label>
        ))}
      </div>

      <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[11px] uppercase tracking-wider opacity-60 flex items-center gap-1">
          <Volume2 size={12} /> Âm thanh gõ phím
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span>Bật tiếng mechanical</span>
          <input
            type="checkbox"
            checked={keyboardSound}
            onChange={(e) => {
              setKeyboardSound(e.target.checked);
              setKeyboardSoundEnabled(e.target.checked);
            }}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>Volume ({keyboardVolume}%)</span>
          <input
            type="range"
            min={50}
            max={300}
            step={10}
            value={keyboardVolume}
            disabled={!keyboardSound}
            onChange={(e) => {
              const v = Number(e.target.value);
              setKeyboardVolume(v);
              setKbVolLib(v);
              playKeySound('a');
            }}
            className="flex-1 max-w-[140px]"
          />
        </label>
        <button
          className="btn-glass text-xs px-3 py-1"
          onClick={() => playKeySound('Enter')}
        >
          Test sound
        </button>
      </div>

      <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[11px] uppercase tracking-wider opacity-60 flex items-center gap-1">
          <MousePointer2 size={12} /> Khác
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span>Con trỏ kiểu MacBook</span>
          <input
            type="checkbox"
            checked={cursorStyle === 'mac'}
            onChange={(e) => setCursorStyle(e.target.checked ? 'mac' : 'default')}
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-1">
            <Sparkles size={12} /> Hiện mascot CodeBuddy
          </span>
          <input type="checkbox" checked={showMascot} onChange={(e) => setShowMascot(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span>Hiện màn chào lần sau</span>
          <input type="checkbox" checked={showWelcome} onChange={(e) => setShowWelcome(e.target.checked)} />
        </label>
      </div>

      <button
        className="btn-glass text-xs px-3 py-1.5 flex items-center gap-1"
        onClick={() => {
          if (confirm('Reset toàn bộ tùy chọn về mặc định?')) resetPrefs();
        }}
      >
        <RotateCcw size={12} /> Reset prefs
      </button>
    </div>
  );
}
