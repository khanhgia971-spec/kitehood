import { useState, useEffect, useRef, useMemo } from 'react';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';
import { usePrefsStore } from '../../stores/prefs';
import { usePreviewStore } from '../../stores/preview';

type Cmd = {
  id: string;
  label: string;
  key?: string;
  group?: string;
  run: () => void;
};

interface Props {
  onClose: () => void;
}

export function CommandPalette({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const createFile = useFSStore((s) => s.createFile);
  const nodes = useFSStore((s) => s.nodes);
  const getPath = useFSStore((s) => s.getPath);
  const openTab = useEditorStore((s) => s.openTab);
  const setTheme = usePrefsStore((s) => s.setTheme);
  const setPreviewOpen = usePreviewStore((s) => s.setOpen);

  const commands: Cmd[] = useMemo(() => {
    const base: Cmd[] = [
      {
        id: 'file.new',
        label: 'File: Tạo file mới',
        key: 'Ctrl+N',
        group: 'File',
        run: () => {
          const name = prompt('Tên file:', 'untitled.js') || 'untitled.js';
          const lang =
            name.endsWith('.py')
              ? 'python'
              : name.endsWith('.html')
                ? 'html'
                : name.endsWith('.css')
                  ? 'css'
                  : name.endsWith('.ts')
                    ? 'typescript'
                    : 'javascript';
          const id = createFile(name, null, '', lang);
          openTab(id);
        },
      },
      {
        id: 'file.save',
        label: 'File: Lưu project',
        key: 'Ctrl+S',
        group: 'File',
        run: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true })),
      },
      {
        id: 'templates',
        label: 'Project: Mở Templates',
        group: 'File',
        run: () => window.dispatchEvent(new CustomEvent('mhc:templates')),
      },
      {
        id: 'view.explorer',
        label: 'View: Explorer',
        group: 'View',
        run: () => window.dispatchEvent(new CustomEvent('mhc:view', { detail: 'explorer' })),
      },
      {
        id: 'view.search',
        label: 'View: Tìm trong project',
        group: 'View',
        run: () => window.dispatchEvent(new CustomEvent('mhc:view', { detail: 'search' })),
      },
      {
        id: 'view.ai',
        label: 'View: AI Agent',
        group: 'View',
        run: () => window.dispatchEvent(new CustomEvent('mhc:view', { detail: 'ai' })),
      },
      {
        id: 'view.learn',
        label: 'View: Học tập',
        group: 'View',
        run: () => window.dispatchEvent(new CustomEvent('mhc:view', { detail: 'learn' })),
      },
      {
        id: 'view.settings',
        label: 'View: Settings',
        group: 'View',
        run: () => window.dispatchEvent(new CustomEvent('mhc:view', { detail: 'settings' })),
      },
      {
        id: 'view.docs',
        label: 'View: Language Docs',
        group: 'View',
        run: () => window.dispatchEvent(new CustomEvent('mhc:view', { detail: 'docs' })),
      },
      {
        id: 'view.preview',
        label: 'View: Toggle Live Preview',
        group: 'View',
        run: () => setPreviewOpen(true),
      },
      {
        id: 'theme.dark',
        label: 'Theme: Dark',
        group: 'Theme',
        run: () => setTheme('dark'),
      },
      {
        id: 'theme.white',
        label: 'Theme: White',
        group: 'Theme',
        run: () => setTheme('white'),
      },
      {
        id: 'theme.milk',
        label: 'Theme: Milk White',
        group: 'Theme',
        run: () => setTheme('milk-white'),
      },
      {
        id: 'help.shortcuts',
        label: 'Help: Phím tắt',
        group: 'Help',
        run: () => window.dispatchEvent(new CustomEvent('mhc:shortcuts')),
      },
      {
        id: 'help.about',
        label: 'About KiteHood',
        group: 'Help',
        run: () =>
          alert(
            'KiteHood — IDE học lập trình trên trình duyệt\nMonaco · Live Preview · Piston · AI Agent · Cloud Sync (KV/D1)'
          ),
      },
    ];

    // Go to file entries
    const files = Object.values(nodes)
      .filter((n) => n.type === 'file')
      .slice(0, 80)
      .map((n) => ({
        id: `goto:${n.id}`,
        label: `Go to File: ${getPath(n.id) || n.name}`,
        group: 'Files',
        run: () => openTab(n.id),
      }));

    return [...base, ...files];
  }, [createFile, openTab, nodes, getPath, setTheme, setPreviewOpen]);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    setSelected(0);
  }, [query]);

  function runSelected() {
    const cmd = filtered[selected];
    if (cmd) {
      cmd.run();
      onClose();
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runSelected();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[12vh] bg-black/55 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass w-[640px] max-w-[92vw] overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
          Command Palette
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Gõ lệnh hoặc tên file…"
          className="w-full bg-transparent px-5 py-3 text-[15px] outline-none border-b border-[var(--glass-border)] placeholder:text-[var(--text-secondary)]"
        />
        <div className="max-h-[340px] overflow-auto py-2">
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              className={`flex items-center justify-between px-5 py-2.5 text-[13.5px] cursor-pointer ${
                i === selected ? 'bg-[var(--accent)]/25 text-white' : 'hover:bg-white/5'
              }`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => {
                cmd.run();
                onClose();
              }}
            >
              <span>
                {cmd.group && (
                  <span className="text-[10px] opacity-50 mr-2 uppercase">{cmd.group}</span>
                )}
                {cmd.label}
              </span>
              {cmd.key && (
                <span className="text-[11px] text-[var(--text-secondary)] font-mono">{cmd.key}</span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-6 text-center text-[var(--text-secondary)] text-sm">
              Không có lệnh phù hợp
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
