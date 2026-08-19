import { useRef, useState, useEffect, useCallback } from 'react';
import { spawnLiquidRipple } from '../../lib/liquidRipple';
import Editor, { loader, OnMount } from '@monaco-editor/react';
import { X, Plus, Volume2, VolumeX } from 'lucide-react';
import { useEditorStore } from '../../stores/editor';
import { usePrefsStore } from '../../stores/prefs';
import { useFSStore } from '../../stores/fs';
import { LanguagePicker } from '../language/LanguagePicker';
import { useRunStore } from '../../stores/run';
import { usePreviewStore } from '../../stores/preview';

loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' },
});

const MONACO_LANG: Record<string, string> = {
  html: 'html', css: 'css', javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', c: 'c', cpp: 'cpp', csharp: 'csharp',
  go: 'go', rust: 'rust', php: 'php', ruby: 'ruby', swift: 'swift',
  kotlin: 'kotlin', lua: 'lua', sql: 'sql', shell: 'shell', bash: 'shell',
  perl: 'perl', r: 'r', dart: 'dart', scala: 'scala', groovy: 'groovy',
  nodejs: 'javascript', react: 'javascript', vue: 'html', svelte: 'html',
  angular: 'typescript', json: 'json', markdown: 'markdown', xml: 'xml',
  yaml: 'yaml', plaintext: 'plaintext', text: 'plaintext',
  mysql: 'sql', postgresql: 'sql', sqlite: 'sql', mongodb: 'javascript',
  coffeescript: 'coffeescript', 'objective-c': 'objective-c',
};

const LANG_COLORS: Record<string, string> = {
  html: 'text-orange-400',
  css: 'text-blue-400',
  javascript: 'text-yellow-400',
  typescript: 'text-blue-300',
  python: 'text-green-400',
  java: 'text-red-400',
  cpp: 'text-purple-400',
  c: 'text-purple-300',
  go: 'text-cyan-400',
  rust: 'text-orange-300',
  php: 'text-indigo-400',
  ruby: 'text-red-300',
  sql: 'text-teal-400',
  shell: 'text-green-300',
};

const HTML_BOILERPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document Title</title>
</head>
<body>
    <h1>Xin chào KiteHood 🪁</h1>
</body>
</html>
`;

const SNIPPETS: Record<string, Record<string, string>> = {
  html: {
    '!': HTML_BOILERPLATE,
    html5: HTML_BOILERPLATE,
  },
  css: {
    '!': `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, sans-serif;
}
`,
  },
  javascript: {
    '!': `console.log('Xin chào KiteHood 🪁!');
`,
  },
  typescript: {
    '!': `const message: string = 'Xin chào KiteHood 🪁!';
console.log(message);
`,
  },
  python: {
    '!': `print("Xin chào KiteHood 🪁!")
`,
  },
  java: {
    '!': `public class Main {
    public static void main(String[] args) {
        System.out.println("Xin chào KiteHood 🪁!");
    }
}
`,
  },
  c: {
    '!': `#include <stdio.h>
int main() {
    printf("Xin chào KiteHood 🪁!\\n");
    return 0;
}
`,
  },
  cpp: {
    '!': `#include <iostream>
int main() {
    std::cout << "Xin chào KiteHood 🪁!" << std::endl;
    return 0;
}
`,
  },
};

/**
 * ASUS mechanical keyboard sound (anniversary switch feel)
 * Sharp blue-switch click + plastic housing resonance. Volume +250%. Delay ~0.01ms.
 */
function playKeySound(ctx: AudioContext | null, kind: 'normal' | 'enter' | 'space' = 'normal') {
  // Deep mechanical switch (shared engine)
  const key = kind === 'enter' ? 'Enter' : kind === 'space' ? ' ' : 'a';
  playGlobalKeySound(key);
}


export function EditorArea() {
  const {
    tabs,
    activeTabId,
    setActive,
    closeTab,
    closeOthers,
    closeToTheRight,
    closeAll,
    markDirty,
    updateTabLanguage,
    syncFromFS,
  } = useEditorStore();
  const { nodes, updateContent, getPath, setNodeLanguage, rename } = useFSStore();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [langPickerForTab, setLangPickerForTab] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(() => false);
  const setPreviewOpen = usePreviewStore((s) => s.setOpen);
  const minimap = usePrefsStore((s) => s.minimap);
  const fontSize = usePrefsStore((s) => s.fontSize);
  const wordWrap = usePrefsStore((s) => s.wordWrap);
  const defaultFileId = usePreviewStore((s) => s.defaultFileId);
  const setDefaultFileId = usePreviewStore((s) => s.setDefaultFileId);
  const requestRefresh = usePreviewStore((s) => s.requestRefresh);
  const previewActiveFile = usePreviewStore((s) => s.previewActiveFile);
  const linkPickMode = usePreviewStore((s) => s.linkPickMode);
  const setLinkPickMode = usePreviewStore((s) => s.setLinkPickMode);

  const editorRef = useRef<any>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeNode = activeTab ? nodes[activeTab.fileId] : null;

  useEffect(() => {
    localStorage.setItem('khc-key-sound', soundOn ? '1' : '0');
  }, [soundOn]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!activeTab || value === undefined) return;
      updateContent(activeTab.fileId, value);
      markDirty(activeTab.id, true);
    },
    [activeTab, updateContent, markDirty]
  );

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeTab) markDirty(activeTab.id, false);
    });

    // (removed key sound — slow caret CSS only)

    // Snippet: type ! then Enter → expand boilerplate
    editor.onKeyDown((e) => {
      if (e.browserEvent.key !== 'Enter') return;
      const model = editor.getModel();
      if (!model) return;
      const pos = editor.getPosition();
      if (!pos) return;
      const line = model.getLineContent(pos.lineNumber).trim();
      const lang = model.getLanguageId();
      const map = SNIPPETS[lang] || SNIPPETS[lang === 'shell' ? 'bash' : ''];
      if (!map) return;
      const snippet = map[line];
      if (!snippet) return;
      e.preventDefault();
      e.stopPropagation();
      editor.executeEdits('snippet', [
        {
          range: new monaco.Range(pos.lineNumber, 1, pos.lineNumber, model.getLineMaxColumn(pos.lineNumber)),
          text: snippet,
          forceMoveMarkers: true,
        },
      ]);
    });

    // Auto-close HTML tags on ">"  e.g. <a> → <a></a>, <div> → <div></div>
    // Works for short tags like a, p, b, i — same as VS Code
    editor.onKeyDown((e) => {
      if (e.browserEvent.key !== '>') return;
      const model = editor.getModel();
      if (!model) return;
      const lang = model.getLanguageId();
      if (!['html', 'xml', 'javascript', 'typescript', 'php'].includes(lang)) return;
      const pos = editor.getPosition();
      if (!pos) return;
      const line = model.getLineContent(pos.lineNumber);
      const before = line.slice(0, pos.column - 1);
      // match <tag or <tag attrs  (before the > being typed)
      const match = before.match(/<([a-zA-Z][\w:-]*)((?:\s[^>]*)?)$/);
      if (!match) return;
      const tag = match[1];
      const rest = match[2] || '';
      // skip closing tags </a> and self-closing
      if (before.slice(0, pos.column - 1).endsWith('/')) return;
      if (rest.trimEnd().endsWith('/')) return;
      // skip if already typing a closing tag
      if (/<\//.test(before.slice(Math.max(0, before.length - 20)))) {
        const openIdx = before.lastIndexOf('<');
        if (openIdx >= 0 && before[openIdx + 1] === '/') return;
      }
      const voidTags = new Set([
        'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
      ]);
      if (voidTags.has(tag.toLowerCase())) return;
      // Don't auto-close <link> etc already void; <a> MUST close
      e.browserEvent.preventDefault?.();
      // Insert > and </tag>, cursor between
      setTimeout(() => {
        const p2 = editor.getPosition();
        if (!p2) return;
        // '>' may already be inserted by Monaco — check
        const line2 = model.getLineContent(p2.lineNumber);
        const col = p2.column;
        const needsGt = line2[col - 2] !== '>';
        const insert = (needsGt ? '>' : '') + `</${tag}>`;
        editor.executeEdits('auto-close-tag', [
          {
            range: new monaco.Range(p2.lineNumber, p2.column, p2.lineNumber, p2.column),
            text: insert,
            forceMoveMarkers: true,
          },
        ]);
        // cursor between tags: after >
        const offset = needsGt ? 1 : 0;
        editor.setPosition({ lineNumber: p2.lineNumber, column: p2.column + offset });
      }, 0);
    });

    // Emmet-like: type tag name then Tab → <tag></tag>  (a, div, p, span, ...)
    editor.onKeyDown((e) => {
      if (e.browserEvent.key !== 'Tab') return;
      const model = editor.getModel();
      if (!model) return;
      const lang = model.getLanguageId();
      if (!['html', 'xml', 'javascript', 'typescript'].includes(lang)) return;
      const pos = editor.getPosition();
      if (!pos) return;
      const line = model.getLineContent(pos.lineNumber);
      const left = line.slice(0, pos.column - 1);
      const m = left.match(/(?:^|[\s>])([a-zA-Z][\w:-]*)$/);
      if (!m) return;
      const tag = m[1];
      const voidTags = new Set([
        'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
      ]);
      // only expand common HTML tags
      const known = new Set([
        'a','div','span','p','h1','h2','h3','h4','h5','h6','ul','ol','li','section','article',
        'header','footer','nav','main','button','form','label','table','tr','td','th','thead','tbody',
        'strong','em','b','i','u','code','pre','blockquote','figure','figcaption','video','audio',
      ]);
      if (!known.has(tag.toLowerCase())) return;
      e.preventDefault();
      e.stopPropagation();
      const startCol = pos.column - tag.length;
      let text: string;
      if (voidTags.has(tag.toLowerCase())) {
        text = `<${tag} />`;
      } else if (tag.toLowerCase() === 'a') {
        text = `<a href=""></a>`;
      } else {
        text = `<${tag}></${tag}>`;
      }
      editor.executeEdits('emmet-tab', [
        {
          range: new monaco.Range(pos.lineNumber, startCol, pos.lineNumber, pos.column),
          text,
          forceMoveMarkers: true,
        },
      ]);
      // place cursor inside
      if (tag.toLowerCase() === 'a') {
        // inside href=""
        editor.setPosition({ lineNumber: pos.lineNumber, column: startCol + 9 });
      } else if (!voidTags.has(tag.toLowerCase())) {
        editor.setPosition({
          lineNumber: pos.lineNumber,
          column: startCol + tag.length + 2,
        });
      }
    });
  };

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    if (editorRef.current) {
      const monaco = (window as any).monaco;
      if (monaco) {
        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
      }
    }
  });

  function handleChangeLanguage(lang: string) {
    if (langPickerForTab) {
      const tab = tabs.find((t) => t.id === langPickerForTab);
      if (tab) {
        // Keep IDE language id on node (cpp, bash, nodejs…) for Run detection
        // Monaco only needs a known highlighter id
        const monacoLang = MONACO_LANG[lang] || lang;
        updateTabLanguage?.(tab.id, lang);
        setNodeLanguage?.(tab.fileId, lang);
        // Apply monaco syntax model language if possible
        try {
          const monaco = (window as any).monaco;
          const ed = editorRef.current;
          if (monaco && ed) {
            const model = ed.getModel?.();
            if (model) monaco.editor.setModelLanguage(model, monacoLang);
          }
        } catch { /* */ }
        // Sync Run panel language to the one user picked
        try {
          useRunStore.getState().setLanguage(lang, true);
        } catch { /* */ }
      }
    }
    setLangPickerForTab(null);
    setShowLangPicker(false);
  }

  function renameTab(tabId: string) {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const node = nodes[tab.fileId];
    const name = prompt('Rename file:', node?.name || tab.name);
    if (name && name.trim()) {
      rename(tab.fileId, name.trim());
      syncFromFS();
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative" style={{ background: "var(--bg-primary)" }}>
      <div className="h-9 flex items-end px-1 gap-0.5 overflow-x-auto" style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`liquid-tab group flex items-center gap-2 px-3 h-8 rounded-t border border-b-0 text-[13px] cursor-pointer min-w-0 max-w-[180px] ${
              tab.id === activeTabId
                ? 'liquid-tab-active bg-[var(--bg-primary)] border-[var(--border)]'
                : 'bg-transparent border-transparent hover:bg-[var(--hover)]'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              spawnLiquidRipple(e);
              setCtxMenu(null);
              try { setActive(tab.id); } catch { /* ignore */ }
            }}
            onDoubleClick={() => renameTab(tab.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCtxMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
            }}
          >
            <span
              className={`font-mono text-[10px] shrink-0 ${
                LANG_COLORS[tab.language || ''] || 'text-gray-400'
              }`}
            >
              {(tab.language || 'txt').slice(0, 3).toUpperCase()}
            </span>
            <span className="truncate flex-1">
              {nodes[tab.fileId]?.name || tab.name || 'Untitled'}
              {tab.isDirty ? ' •' : ''}
            </span>
            <button
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--hover)] shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-[var(--hover)] text-[var(--text-secondary)]"
          title="New file / Choose language"
          onClick={() => {
            setLangPickerForTab(null);
            setShowLangPicker(true);
          }}
        >
          <Plus size={16} />
        </button>

        <button
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-[var(--hover)] text-[var(--text-secondary)] ml-auto"
          title={soundOn ? 'Tắt tiếng gõ phím' : 'Bật tiếng gõ phím'}
          onClick={() => setSoundOn((v) => !v)}
        >
          {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      <div className="h-6 flex items-center gap-1 px-3 text-[12px] text-[var(--text-secondary)] border-b border-[var(--border)]">
        <span className="text-[var(--accent)] font-medium">KiteHood</span>
        {activeTab && (
          <>
            <span>/</span>
            <span
              className="cursor-pointer hover:underline"
              title="Double-click tab or right-click → Rename"
              onDoubleClick={() => renameTab(activeTab.id)}
            >
              {getPath(activeTab.fileId)}
            </span>
            {activeNode?.language && (
              <>
                <span className="mx-1 opacity-40">·</span>
                <button
                  className="text-[var(--accent)] hover:underline"
                  title="Change language"
                  onClick={() => {
                    setLangPickerForTab(activeTab.id);
                    setShowLangPicker(true);
                  }}
                >
                  {activeNode.language}
                </button>
              </>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className="btn-accent text-[10px] px-2.5 py-1 rounded-lg"
            title="Preview tab dang mo"
            onClick={() => {
              if (!activeNode) {
                setPreviewOpen(true);
                requestRefresh();
                return;
              }
              // Preview dung tab dang mo — khong bi khoa boi Set default
              previewActiveFile(activeNode.id);
            }}
          >
            Preview
          </button>
          <button
            type="button"
            className="btn-glass text-[10px] px-2.5 py-1 rounded-lg"
            title="Chi dung khi F5 / mo lai web — khong khoa Preview khi doi tab"
            style={{
              outline: defaultFileId && activeNode && defaultFileId === activeNode.id
                ? '1px solid var(--accent)'
                : undefined,
            }}
            onClick={() => {
              if (!activeNode) return;
              const next = defaultFileId === activeNode.id ? null : activeNode.id;
              setDefaultFileId(next);
              try {
                localStorage.setItem('mhc-default-file', next || '');
              } catch { /* */ }
            }}
          >
            {defaultFileId && activeNode && defaultFileId === activeNode.id ? '★ Default' : 'Set default'}
          </button>
          <button
            type="button"
            className="btn-glass text-[10px] px-2.5 py-1 rounded-lg"
            title="Chen mau comment / TODO"
            onClick={() => {
              if (!activeNode) return;
              const lang = (activeNode.language || '').toLowerCase();
              const c =
                lang.includes('py') ? '# TODO: \n' :
                lang.includes('html') ? '<!-- TODO -->\n' :
                '// TODO: \n';
              updateContent(activeNode.id, c + (activeNode.content || ''));
            }}
          >
            + TODO
          </button>
          <button
            type="button"
            className="btn-glass text-[10px] px-2.5 py-1 rounded-lg"
            title="Lien ket file CSS/JS vao HTML dang mo (them the link/script trong head)"
            style={{
              background: linkPickMode ? 'var(--accent-muted)' : undefined,
              color: linkPickMode ? 'var(--accent)' : undefined,
            }}
            onClick={() => {
              if (!activeNode) return;
              const isHtml =
                (activeNode.language || '').includes('html') ||
                /\.html?$/i.test(activeNode.name || '');
              if (!isHtml) {
                alert('Hay mo tab HTML truoc, roi bam Connect link va chon file CSS/JS trong Explorer.');
                return;
              }
              setLinkPickMode(!linkPickMode);
            }}
          >
            {linkPickMode ? 'Chọn file…' : 'Connect link'}
          </button>
          <span className="text-[10px] opacity-40 hidden sm:inline">
            ! + Enter = boilerplate
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 liquid-page" key={activeTabId}>
        {activeNode ? (
          <Editor
            key={activeNode.id}
            height="100%"
            language={MONACO_LANG[activeNode.language || ''] || 'plaintext'}
            value={activeNode.content || ''}
            theme={
              document.documentElement.getAttribute('data-theme') === 'dark'
                ? 'vs-dark'
                : 'vs'
            }
            onChange={handleChange}
            onMount={onMount}
            options={{
              fontSize: 14,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, monospace",
              fontLigatures: false,
              minimap: { enabled: minimap },
              automaticLayout: true,
              renderWhitespace: 'none',
              smoothScrolling: false,
              cursorBlinking: 'solid',
              cursorSmoothCaretAnimation: 'off',
              occurrencesHighlight: 'off',
              codeLens: false,
              folding: false,
              matchBrackets: 'near',
              colorDecorators: false,
              renderLineHighlight: 'line',
              links: false,
              bracketPairColorization: { enabled: true },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoClosingOvertype: 'always',
              autoSurround: 'languageDefined',
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              padding: { top: 14 },
              renderLineHighlight: 'all',
              guides: { indentation: true, bracketPairs: true },
              acceptSuggestionOnCommitCharacter: true,
              quickSuggestions: true,
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] gap-3">
            <p className="text-sm">No file open</p>
            <button
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm"
              onClick={() => setShowLangPicker(true)}
            >
              Choose a language to get started
            </button>
          </div>
        )}
      </div>

      {ctxMenu && (
        <TabContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          tabId={ctxMenu.tabId}
          onClose={() => setCtxMenu(null)}
          onCloseTab={closeTab}
          onCloseOthers={closeOthers}
          onCloseRight={closeToTheRight}
          onCloseAll={closeAll}
          onRename={() => renameTab(ctxMenu.tabId)}
          onChangeLanguage={() => {
            setLangPickerForTab(ctxMenu.tabId);
            setCtxMenu(null);
            setShowLangPicker(true);
          }}
        />
      )}

      {showLangPicker && (
        <LanguagePicker
          onClose={() => {
            setShowLangPicker(false);
            setLangPickerForTab(null);
          }}
          onPick={langPickerForTab ? handleChangeLanguage : undefined}
        />
      )}
    </div>
  );
}

function TabContextMenu({
  x,
  y,
  tabId,
  onClose,
  onCloseTab,
  onCloseOthers,
  onCloseRight,
  onCloseAll,
  onRename,
  onChangeLanguage,
}: {
  x: number;
  y: number;
  tabId: string;
  onClose: () => void;
  onCloseTab: (id: string) => void;
  onCloseOthers: (id: string) => void;
  onCloseRight: (id: string) => void;
  onCloseAll: () => void;
  onRename: () => void;
  onChangeLanguage: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', h, true);
    return () => window.removeEventListener('mousedown', h, true);
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 200);
  const top = Math.min(y, window.innerHeight - 260);

  const items: Array<{ label?: string; action?: () => void; type?: 'sep' }> = [
    { label: 'Rename', action: onRename },
    { label: 'Change Language…', action: onChangeLanguage },
    { type: 'sep' },
    { label: 'Close', action: () => onCloseTab(tabId) },
    { label: 'Close Others', action: () => onCloseOthers(tabId) },
    { label: 'Close to the Right', action: () => onCloseRight(tabId) },
    { label: 'Close All', action: () => onCloseAll() },
  ];

  return (
    <div
      ref={ref}
      className="fixed min-w-[200px] py-1.5 rounded-xl text-[13px]"
      style={{
        left,
        top,
        zIndex: 100000,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        color: 'var(--text-primary)',
      }}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((it, i) =>
        it.type === 'sep' ? (
          <div
            key={i}
            className="my-1"
            style={{ borderTop: '1px solid var(--border)', margin: '4px 8px' }}
          />
        ) : (
          <button
            key={it.label}
            type="button"
            className="w-full text-left px-3.5 py-2 rounded-lg"
            style={{ color: 'var(--text-primary)', background: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              it.action?.();
              onClose();
            }}
          >
            {it.label}
          </button>
        )
      )}
    </div>
  );
}
