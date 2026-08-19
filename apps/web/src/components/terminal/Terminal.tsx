import { useState, useRef, useEffect, useCallback } from 'react';
import { useFSStore } from '../../stores/fs';
import { useRunStore } from '../../stores/run';

type Line = { type: 'input' | 'output' | 'error' | 'info'; text: string };

export function TerminalPanel() {
  const { nodes, rootIds, getChildren, getPath, createFile, updateContent } = useFSStore();
  const setLanguage = useRunStore((s) => s.setLanguage);
  const [cwd, setCwd] = useState<string | null>(null); // null = project root
  const [lines, setLines] = useState<Line[]>([
    { type: 'info', text: 'KiteHood Terminal (ẢO — không chạy npm/node server thật)' },
    { type: 'info', text: 'Gõ "help" để xem lệnh. FS ảo phản ánh file project của bạn.' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const resolvePath = useCallback(
    (path: string): string | null => {
      // returns node id or null for root
      if (!path || path === '/' || path === '.') return null;
      const parts = path.replace(/^\.\//, '').replace(/\/$/, '').split('/').filter(Boolean);
      let parent: string | null = cwd;
      let id: string | null = null;
      for (const part of parts) {
        if (part === '..') {
          if (parent) {
            const n = nodes[parent];
            parent = n?.parentId ?? null;
            id = parent;
          }
          continue;
        }
        const children = getChildren(parent);
        const found = children.find((c) => c.name === part);
        if (!found) return undefined as any; // not found marker
        id = found.id;
        parent = found.id;
      }
      return id;
    },
    [cwd, nodes, getChildren]
  );

  const runCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      setLines((prev) => [...prev, { type: 'input', text: `$ ${trimmed}` }]);
      setHistory((h) => [trimmed, ...h].slice(0, 80));
      setHistIdx(-1);

      const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((p) => p.replace(/^"|"$/g, '')) || [];
      const name = (parts[0] || '').toLowerCase();
      const args = parts.slice(1);
      let out = '';
      let err = false;

      try {
        switch (name) {
          case 'help':
            out = `Lệnh hỗ trợ (Terminal ẢO):
  help              Hiện trợ giúp
  clear             Xóa màn hình
  pwd               Thư mục hiện tại
  ls [path]         Liệt kê file
  cd [path]         Đổi thư mục
  cat <file>        Xem nội dung file
  echo <text>       In chữ
  touch <file>      Tạo file trống
  mkdir <dir>       Tạo thư mục
  tree              Cây thư mục project
  node <file>       Chạy JS (sandbox trình duyệt)
  node -e "code"    Eval JS nhanh
  python / python3  → dùng panel Run (Piston) để chạy thật
  npm install       Mô phỏng — browser KHÔNG cài package thật
  npm run dev       Mô phỏng — dùng Live Preview cho web
  date / whoami     Thông tin giả lập
  exit              Xóa & reset prompt

⚠ Đây là terminal ảo học tập, không phải shell server.`;
            break;
          case 'clear':
            setLines([]);
            return;
          case 'pwd': {
            if (!cwd) out = '/project';
            else out = '/project/' + getPath(cwd);
            break;
          }
          case 'ls': {
            const target = args[0] ? resolvePath(args[0]) : cwd;
            if (target === (undefined as any)) {
              out = `ls: cannot access '${args[0]}': No such file or directory`;
              err = true;
              break;
            }
            const children = getChildren(target ?? null);
            if (children.length === 0) out = '(empty)';
            else
              out = children
                .map((c) => (c.type === 'folder' ? c.name + '/' : c.name))
                .join('  ');
            break;
          }
          case 'cd': {
            if (!args[0] || args[0] === '/' || args[0] === '~') {
              setCwd(null);
              out = '';
              break;
            }
            const target = resolvePath(args[0]);
            if (target === (undefined as any)) {
              out = `cd: no such file or directory: ${args[0]}`;
              err = true;
            } else if (target && nodes[target]?.type === 'file') {
              out = `cd: not a directory: ${args[0]}`;
              err = true;
            } else {
              setCwd(target);
              out = '';
            }
            break;
          }
          case 'cat': {
            if (!args[0]) {
              out = 'Usage: cat <file>';
              err = true;
              break;
            }
            const id = resolvePath(args[0]);
            if (!id || !nodes[id] || nodes[id].type !== 'file') {
              out = `cat: ${args[0]}: No such file`;
              err = true;
            } else {
              out = nodes[id].content || '';
            }
            break;
          }
          case 'echo':
            out = args.join(' ');
            break;
          case 'touch': {
            if (!args[0]) {
              out = 'Usage: touch <file>';
              err = true;
              break;
            }
            createFile(args[0], cwd);
            out = `created ${args[0]}`;
            break;
          }
          case 'mkdir': {
            if (!args[0]) {
              out = 'Usage: mkdir <dir>';
              err = true;
              break;
            }
            useFSStore.getState().createFolder(args[0], cwd);
            out = `created directory ${args[0]}`;
            break;
          }
          case 'tree': {
            const walk = (parentId: string | null, prefix: string): string[] => {
              const kids = getChildren(parentId);
              const lines: string[] = [];
              kids.forEach((k, i) => {
                const last = i === kids.length - 1;
                const branch = last ? '└── ' : '├── ';
                lines.push(prefix + branch + k.name + (k.type === 'folder' ? '/' : ''));
                if (k.type === 'folder') {
                  lines.push(...walk(k.id, prefix + (last ? '    ' : '│   ')));
                }
              });
              return lines;
            };
            out = 'project/\n' + walk(null, '').join('\n');
            break;
          }
          case 'node': {
            if (args[0] === '-e' && args[1]) {
              try {
                // eslint-disable-next-line no-eval
                const result = eval(args.slice(1).join(' '));
                out = String(result ?? '');
              } catch (e: any) {
                out = e.message;
                err = true;
              }
            } else if (args[0]) {
              const id = resolvePath(args[0]);
              if (!id || !nodes[id]) {
                out = `Cannot find module '${args[0]}'`;
                err = true;
              } else {
                try {
                  const logs: string[] = [];
                  const fakeConsole = {
                    log: (...a: any[]) => logs.push(a.map(String).join(' ')),
                    error: (...a: any[]) => logs.push('[error] ' + a.map(String).join(' ')),
                    warn: (...a: any[]) => logs.push('[warn] ' + a.map(String).join(' ')),
                  };
                  const fn = new Function('console', nodes[id].content || '');
                  fn(fakeConsole);
                  out = logs.join('\n') || '(no output)';
                } catch (e: any) {
                  out = e.message;
                  err = true;
                }
              }
            } else {
              out = 'Usage: node <file>  |  node -e "code"';
              err = true;
            }
            break;
          }
          case 'python':
          case 'python3':
            out =
              'Python runs via the Run panel (Piston/Judge0 backend).\nSelect language Python and click Run.';
            setLanguage?.('python');
            break;
          case 'npm':
            if (args[0] === 'install' || args[0] === 'i') {
              out = `[simulated] npm install ${args.slice(1).join(' ') || ''}\nBrowser sandbox cannot install real packages.\nFor Node projects use external runner or download & run locally.`;
            } else if (args[0] === 'run' && args[1] === 'dev') {
              out =
                '[simulated] npm run dev\nOpen Live Preview for HTML/CSS/JS.\nFor React/Vue use download + local terminal.';
            } else {
              out = `npm ${args.join(' ')} – limited in browser. Use Download Project for full Node workflow.`;
            }
            break;
          case 'date':
            out = new Date().toString();
            break;
          case 'whoami':
            out = 'developer@moihoccode';
            break;
          case 'exit':
            out = 'Terminal session kept. Use panel toggle to hide.';
            break;
          default:
            out = `command not found: ${name}\nType "help" for available commands.`;
            err = true;
        }
      } catch (e: any) {
        out = e?.message || String(e);
        err = true;
      }

      if (out !== '') {
        setLines((prev) => [
          ...prev,
          { type: err ? 'error' : 'output', text: out },
        ]);
      }
    },
    [cwd, nodes, getChildren, getPath, resolvePath, createFile, setLanguage]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      if (history[next]) {
        setHistIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = histIdx - 1;
      if (next < 0) {
        setHistIdx(-1);
        setInput('');
      } else {
        setHistIdx(next);
        setInput(history[next]);
      }
    }
  };

  const promptPath = cwd ? getPath(cwd) : 'project';

  return (
    <div
      className="flex flex-col h-full font-mono text-[12px]" style={{ background: '#0d0d14' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-auto p-2 space-y-0.5">
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.type === 'input'
                ? 'text-emerald-400'
                : l.type === 'error'
                ? 'text-red-400 whitespace-pre-wrap'
                : l.type === 'info'
                ? 'text-blue-400/80'
                : 'text-gray-300 whitespace-pre-wrap'
            }
          >
            {l.text}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 shrink-0">
            {promptPath} $
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent outline-none text-gray-100 caret-emerald-400"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export { TerminalPanel as Terminal };
