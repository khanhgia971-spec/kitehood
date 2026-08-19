import { useEffect, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { useRunStore } from '../../stores/run';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';
import { usePreviewStore } from '../../stores/preview';
import {
  PISTON_MAP,
  RUN_LANGUAGE_OPTIONS,
  FALLBACK_PISTON_VERSION,
  detectLangFromFile,
} from '../../lib/languages';
import { runRemoteCode, canRunRemote } from '../../lib/codeRunner';
import clsx from 'clsx';

function getActiveCode(
  activeTabId: string | null,
  tabs: { id: string; fileId: string; language?: string }[],
  nodes: Record<string, { type?: string; content?: string; language?: string; name?: string }>
): { code: string; fileName: string; detected: string | null } {
  if (activeTabId) {
    const tab = tabs.find((t) => t.id === activeTabId);
    const fileId = tab?.fileId || activeTabId;
    const node = nodes[fileId];
    if (node && node.type === 'file' && node.content != null) {
      const fileName = node.name || 'main';
      const detected = detectLangFromFile(fileName, node.language || tab?.language);
      return { code: node.content, fileName, detected };
    }
    const direct = nodes[activeTabId];
    if (direct && direct.type === 'file' && direct.content != null) {
      const fileName = direct.name || 'main';
      return {
        code: direct.content,
        fileName,
        detected: detectLangFromFile(fileName, direct.language),
      };
    }
  }
  return { code: '', fileName: 'main', detected: null };
}

function prepareCode(lang: string, code: string, fileName: string) {
  if (lang === 'java') {
    const m = code.match(/public\s+class\s+(\w+)/);
    const className = m?.[1] || 'Main';
    return { content: code, name: `${className}.java` };
  }
  const piston = PISTON_MAP[lang];
  return { content: code, name: fileName || piston?.filename || 'main.txt' };
}

function isPreviewLang(lang: string) {
  const p = PISTON_MAP[lang];
  return lang === 'html' || lang === 'css' || !!p?.preview;
}

export function RunPanel() {
  const {
    language,
    stdin,
    stdout,
    stderr,
    status,
    exitCode,
    timeMs,
    memoryKb,
    userPinnedLang,
    setLanguage,
    setStdin,
    setResult,
    reset,
    clearPin,
  } = useRunStore();
  const { nodes } = useFSStore();
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const setPreviewOpen = usePreviewStore((s) => s.setOpen);
  const runningRef = useRef(false);
  const lastTabRef = useRef<string | null>(null);
  const lastAutoKey = useRef('');

  async function execute(langOverride?: string) {
    if (runningRef.current) return;
    runningRef.current = true;
    setResult({ status: 'running', stdout: '', stderr: '' });
    const start = performance.now();
    const { code, fileName, detected } = getActiveCode(activeTabId, tabs, nodes);
    const lang = langOverride || language || detected || 'javascript';

    // Preview languages
    if (isPreviewLang(lang)) {
      setPreviewOpen(true);
      try {
        window.dispatchEvent(new CustomEvent('fs:imported'));
      } catch {
        /* */
      }
      setResult({
        status: 'success',
        stdout:
          `Live Preview · ngôn ngữ: ${lang}\n` +
          (fileName ? `File: ${fileName}\n` : '') +
          'HTML/CSS/JS web được nhúng inline.',
        exitCode: 0,
        timeMs: Math.round(performance.now() - start),
        memoryKb: 0,
      });
      runningRef.current = false;
      return;
    }

    if (!code.trim()) {
      setResult({
        status: 'error',
        stdout: '',
        stderr: 'Không có code trong tab đang mở.',
        exitCode: 1,
        timeMs: Math.round(performance.now() - start),
        memoryKb: 0,
      });
      runningRef.current = false;
      return;
    }

    // JS sandbox (not when pinned to something else)
    if (lang === 'javascript' || lang === 'nodejs') {
      try {
        const logs: string[] = [];
        const fakeConsole = {
          log: (...args: any[]) => logs.push(args.map(String).join(' ')),
          error: (...args: any[]) => logs.push('[error] ' + args.map(String).join(' ')),
          warn: (...args: any[]) => logs.push('[warn] ' + args.map(String).join(' ')),
          info: (...args: any[]) => logs.push(args.map(String).join(' ')),
        };
        const fn = new Function('console', 'stdin', code);
        fn(fakeConsole, stdin);
        setResult({
          status: 'success',
          stdout: logs.join('\n') || '(no output)',
          exitCode: 0,
          timeMs: Math.round(performance.now() - start),
          memoryKb: Math.round(code.length / 10),
        });
        runningRef.current = false;
        return;
      } catch {
        // fall through to Piston
      }
    }

    // Remote: Judge0 CE → Wandbox (Piston public whitelist-only 2026)
    if (!canRunRemote(lang) && !PISTON_MAP[lang]) {
      setResult({
        status: 'error',
        stdout: '',
        stderr: `Ngôn ngữ "${lang}" chưa hỗ trợ chạy remote.`,
        exitCode: 1,
        timeMs: Math.round(performance.now() - start),
        memoryKb: 0,
      });
      runningRef.current = false;
      return;
    }

    try {
      const result = await runRemoteCode(lang, code, stdin);
      setResult({
        status: result.exitCode === 0 ? 'success' : 'error',
        stdout: (result.stdout || '') + (result.backend ? `\n\n— ${result.backend}` : ''),
        stderr: result.stderr,
        exitCode: result.exitCode,
        timeMs: result.timeMs || Math.round(performance.now() - start),
        memoryKb: 0,
      });
    } catch (e: any) {
      setResult({
        status: 'error',
        stdout: '',
        stderr:
          `Không chạy được (${lang}).\n` +
          (e?.message || String(e)),
        exitCode: 1,
        timeMs: Math.round(performance.now() - start),
        memoryKb: 0,
      });
    }
    runningRef.current = false;
  }

  // Tab change → detect language from FILE (not wrong mapping) + auto-run
  useEffect(() => {
    const { code, fileName, detected } = getActiveCode(activeTabId, tabs, nodes);
    if (!activeTabId) return;

    // New tab → clear manual pin so detect applies
    if (lastTabRef.current !== activeTabId) {
      lastTabRef.current = activeTabId;
      clearPin();
      if (detected) {
        setLanguage(detected, false);
      }
    }

    const lang = (!userPinnedLang && detected) || language;
    const key = `${activeTabId}|${fileName}|${(code || '').length}|${lang}`;
    if (key === lastAutoKey.current) return;
    lastAutoKey.current = key;

    if (!userPinnedLang && detected && detected !== language) {
      setLanguage(detected, false);
    }

    // PERF: khong auto-run khi doi tab (tiet kiem CPU + mang).
    // User bam Run / Preview moi chay.
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, nodes, tabs]);

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-2 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
        <select
          value={language}
          onChange={(e) => {
            const l = e.target.value;
            setLanguage(l, true); // user pinned — don't auto-switch away
            void execute(l);
          }}
          className="px-2 py-1 text-xs rounded-lg max-w-[160px]"
          title="Chọn ngôn ngữ chạy (ghim khi chọn tay)"
        >
          {/* ensure current value always in list */}
          {!RUN_LANGUAGE_OPTIONS.some((o) => o.id === language) && (
            <option value={language}>{language}</option>
          )}
          {RUN_LANGUAGE_OPTIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          className={clsx(
            'btn-accent flex items-center gap-1 px-3 py-1 text-xs rounded-lg',
            status === 'running' && 'opacity-70'
          )}
          disabled={status === 'running'}
          onClick={() => void execute()}
        >
          <Play size={12} /> {status === 'running' ? 'Đang chạy…' : 'Run'}
        </button>
        <button className="btn-glass px-2 py-1 text-xs rounded-lg" onClick={() => reset()}>
          <RotateCcw size={12} />
        </button>
        <span className="text-[10px] opacity-50 ml-auto">
          OneCompiler-style · chọn lang · Run
        </span>
      </div>

      <div className="px-2 py-1 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] opacity-50 mb-0.5">stdin</div>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={2}
          className="w-full px-2 py-1 text-xs rounded-lg font-mono"
          placeholder="Input chương trình…"
        />
      </div>

      <div className="flex-1 overflow-auto p-3 font-mono text-[12.5px]">
        {status === 'idle' && (
          <p className="opacity-50 text-xs leading-relaxed">
            Chọn ngôn ngữ → viết code → <b>Run</b>.<br/>
            HTML/CSS/JS: bấm <b>Preview</b> (live sau khi gõ).<br/>
            C/C++/Python/Java… chạy qua Judge0 / Wandbox.
          </p>
        )}
        {status === 'running' && <p className="opacity-70">Đang chạy…</p>}
        {stdout && <pre className="whitespace-pre-wrap text-emerald-400/90 mb-2">{stdout}</pre>}
        {stderr && <pre className="whitespace-pre-wrap text-red-400/90">{stderr}</pre>}
        {(timeMs != null || exitCode != null) && status !== 'running' && (
          <p className="text-[10px] opacity-50 mt-2">
            lang={language} · exit={exitCode ?? '—'} · {timeMs ?? 0} ms
          </p>
        )}
      </div>
    </div>
  );
}
