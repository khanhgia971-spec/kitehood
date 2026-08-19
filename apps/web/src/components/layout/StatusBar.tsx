import { Eye, Play, Terminal, Palette } from 'lucide-react';

interface Props {
  theme: string;
  onThemeChange: (t: 'dark' | 'white' | 'milk-white') => void;
  onTogglePreview?: () => void;
  onToggleRun?: () => void;
  onToggleTerminal?: () => void;
}

export function StatusBar({
  theme,
  onThemeChange,
  onTogglePreview,
  onToggleRun,
  onToggleTerminal,
}: Props) {
  const themeLabel =
    theme === 'dark' ? 'Dark' : theme === 'white' ? 'White' : 'Milk';

  return (
    <div className="status-bar h-[28px] flex items-center px-3 gap-2.5 select-none shrink-0">
      <span className="font-semibold tracking-wide text-[11px]">KiteHood</span>
      <span className="opacity-40">·</span>
      <span className="opacity-90 text-[11px]">main</span>
      <div className="flex-1" />
      <button
        onClick={onToggleTerminal}
        className="flex items-center gap-1 px-2 py-0.5 text-[11px]"
        title="Terminal (Ctrl+`)"
      >
        <Terminal size={12} /> Terminal
      </button>
      <button
        onClick={onToggleRun}
        className="flex items-center gap-1 px-2 py-0.5 text-[11px]"
        title="Run Panel"
      >
        <Play size={12} /> Run
      </button>
      <button
        onClick={onTogglePreview}
        className="flex items-center gap-1 px-2 py-0.5 text-[11px]"
        title="Live Preview"
      >
        <Eye size={12} /> Preview
      </button>
      <button
        onClick={() => {
          const next =
            theme === 'dark' ? 'white' : theme === 'white' ? 'milk-white' : 'dark';
          onThemeChange(next as 'dark' | 'white' | 'milk-white');
        }}
        className="flex items-center gap-1 px-2 py-0.5 text-[11px] capitalize"
        title="Đổi theme Liquid Glass"
      >
        <Palette size={12} /> {themeLabel}
      </button>
      <span className="opacity-70 text-[10px]">UTF-8</span>
      <span className="opacity-70 text-[10px]">LF</span>
    </div>
  );
}
