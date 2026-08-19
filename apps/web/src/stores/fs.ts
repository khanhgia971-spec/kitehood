import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type FileNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  language?: string;
  createdAt: number;
  updatedAt: number;
};

export type ProjectMeta = {
  id: string;
  title: string;
  description?: string;
  visibility: 'public' | 'unlisted' | 'private';
  language: string;
  updatedAt: number;
};

interface FSState {
  project: ProjectMeta;
  nodes: Record<string, FileNode>;
  rootIds: string[];
  selectedId: string | null;
  expanded: Set<string>;

  // actions
  setProject: (p: Partial<ProjectMeta>) => void;
  select: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  createFile: (name: string, parentId: string | null, content?: string, language?: string) => string;
  createFolder: (name: string, parentId: string | null) => string;
  rename: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  setNodeLanguage: (id: string, language: string) => void;
  getChildren: (parentId: string | null) => FileNode[];
  getPath: (id: string) => string;
  loadStarter: (lang: string) => void;
  importNodes: (nodes: FileNode[], rootIds: string[]) => void;
  moveNode: (id: string, newParentId: string | null) => void;
  importExternalFiles: (files: { name: string; content: string }[], parentId?: string | null) => string[];
  /** Import files with relative paths → builds folder tree like VS Code */
  importFileTree: (
    entries: { path: string; content: string }[],
    options?: { expandAll?: boolean }
  ) => { rootIds: string[]; fileIds: string[] };
  expandAll: () => void;
  clearProject: () => void;
}

const STARTERS: Record<string, { name: string; language: string; content: string }[]> = {
  html: [
    {
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html>
<head>
  <title>Xin chào KiteHood 🪁</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <h1 class="title">Xin chào KiteHood 🪁!</h1>
  <p id="currentTime"></p>
  <script src="script.js"></script>
</body>
</html>`,
    },
    {
      name: 'styles.css',
      language: 'css',
      content: `body {
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  background: #0a0a12;
  color: #e8e8f0;
}
.title {
  color: #7c9cff;
  font-size: 2.5rem;
}`,
    },
    {
      name: 'script.js',
      language: 'javascript',
      content: `const el = document.getElementById('currentTime');
function tick() {
  el.textContent = new Date().toUTCString();
}
tick();
setInterval(tick, 1000);`,
    },
  ],
  javascript: [
    {
      name: 'main.js',
      language: 'javascript',
      content: `// KiteHood
console.log('Hello from JavaScript!');
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
console.log('fib(10) =', fib(10));`,
    },
  ],
  typescript: [
    {
      name: 'main.ts',
      language: 'typescript',
      content: `// KiteHood — TypeScript
function greet(name: string): string {
  return \`Xin chào, \${name}!\`;
}
console.log(greet('Developer'));`,
    },
  ],
  python: [
    {
      name: 'main.py',
      language: 'python',
      content: `# KiteHood
print("Hello from Python!")

def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

print("fib(10) =", fib(10))`,
    },
  ],
  java: [
    {
      name: 'Main.java',
      language: 'java',
      content: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Java!");
  }
}`,
    },
  ],
  cpp: [
    {
      name: 'main.cpp',
      language: 'cpp',
      content: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello from C++!" << endl;
  return 0;
}`,
    },
  ],
  c: [
    {
      name: 'main.c',
      language: 'c',
      content: `#include <stdio.h>

int main() {
  printf("Hello from C!\\n");
  return 0;
}`,
    },
  ],
  go: [
    {
      name: 'main.go',
      language: 'go',
      content: `package main
import "fmt"

func main() {
  fmt.Println("Hello from Go!")
}`,
    },
  ],
  rust: [
    {
      name: 'main.rs',
      language: 'rust',
      content: `fn main() {
  println!("Hello from Rust!");
}`,
    },
  ],
  php: [
    {
      name: 'index.php',
      language: 'php',
      content: `<?php
echo "Hello from PHP!\\n";
`,
    },
  ],
  ruby: [
    {
      name: 'main.rb',
      language: 'ruby',
      content: `puts "Hello from Ruby!"`,
    },
  ],
  csharp: [
    {
      name: 'Program.cs',
      language: 'csharp',
      content: `using System;
class Program {
  static void Main() {
    Console.WriteLine("Hello from C#!");
  }
}`,
    },
  ],
  sql: [
    {
      name: 'query.sql',
      language: 'sql',
      content: `SELECT 'Hello from SQL!' AS message;`,
    },
  ],
  react: [
    {
      name: 'App.jsx',
      language: 'javascript',
      content: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Hello React!</h1>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
    </div>
  );
}`,
    },
    {
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html>
<head><title>React App</title></head>
<body>
  <div id="root"></div>
  <script type="module" src="/App.jsx"></script>
</body>
</html>`,
    },
  ],
};

function detectLang(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less',
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', py2: 'python',
    java: 'java', kt: 'kotlin', kts: 'kotlin',
    cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
    c: 'c', h: 'c',
    go: 'go', rs: 'rust', php: 'php', rb: 'ruby',
    cs: 'csharp', fs: 'fsharp', vb: 'vb',
    sql: 'sql', mysql: 'sql', pgsql: 'sql',
    json: 'json', md: 'markdown', markdown: 'markdown',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    vue: 'html', svelte: 'html',
    lua: 'lua', pl: 'perl', r: 'r', R: 'r',
    swift: 'swift', m: 'objective-c',
    dart: 'dart', scala: 'scala', groovy: 'groovy',
    hs: 'haskell', erl: 'erlang', ex: 'elixir', exs: 'elixir',
    clj: 'clojure', lisp: 'lisp', pas: 'pascal',
    asm: 'assembly', s: 'assembly',
    zig: 'zig', nim: 'nim', jl: 'julia', cr: 'crystal',
    coffee: 'coffeescript', ejs: 'html',
    xml: 'xml', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    txt: 'plaintext', text: 'plaintext',
  };
  return map[ext] || 'plaintext';
}

export const useFSStore = create<FSState>()(
  persist(
    (set, get) => ({
      project: {
        id: uuid(),
        title: 'Untitled',
        visibility: 'private',
        language: 'html',
        updatedAt: Date.now(),
      },
      nodes: {},
      rootIds: [],
      selectedId: null,
      expanded: new Set<string>(),

      setProject: (p) =>
        set((s) => ({ project: { ...s.project, ...p, updatedAt: Date.now() } })),

      select: (id) => set({ selectedId: id }),

      toggleExpand: (id) =>
        set((s) => {
          const next = new Set(s.expanded);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { expanded: next };
        }),

      createFile: (name, parentId, content = '', language) => {
        const id = uuid();
        const lang = language || detectLang(name);
        const node: FileNode = {
          id,
          name,
          type: 'file',
          parentId,
          content,
          language: lang,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => {
          const nodes = { ...s.nodes, [id]: node };
          const rootIds = parentId ? s.rootIds : [...s.rootIds, id];
          return { nodes, rootIds, selectedId: id };
        });
        return id;
      },

      createFolder: (name, parentId) => {
        const id = uuid();
        const node: FileNode = {
          id,
          name,
          type: 'folder',
          parentId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => {
          const nodes = { ...s.nodes, [id]: node };
          const rootIds = parentId ? s.rootIds : [...s.rootIds, id];
          const expanded = new Set(s.expanded);
          expanded.add(id);
          return { nodes, rootIds, expanded, selectedId: id };
        });
        return id;
      },

      rename: (id, name) =>
        set((s) => {
          const n = s.nodes[id];
          if (!n) return s;
          return {
            nodes: {
              ...s.nodes,
              [id]: {
                ...n,
                name,
                language: n.type === 'file' ? detectLang(name) : n.language,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      deleteNode: (id) => {
        const s = get();
        const toDelete = new Set<string>();
        const walk = (nid: string) => {
          toDelete.add(nid);
          Object.values(s.nodes)
            .filter((n) => n.parentId === nid)
            .forEach((c) => walk(c.id));
        };
        walk(id);
        const nodes = { ...s.nodes };
        toDelete.forEach((d) => delete nodes[d]);
        set({
          nodes,
          rootIds: s.rootIds.filter((r) => !toDelete.has(r)),
          selectedId: s.selectedId && toDelete.has(s.selectedId) ? null : s.selectedId,
        });
        // Sync tabs – close any tab whose file was deleted
        try {
          // dynamic import avoided – call via window event
          window.dispatchEvent(new CustomEvent('fs:deleted', { detail: [...toDelete] }));
        } catch { /* ignore */ }
      },

      setNodeLanguage: (id, language) =>
        set((s) => {
          const n = s.nodes[id];
          if (!n) return s;
          return {
            nodes: {
              ...s.nodes,
              [id]: { ...n, language, updatedAt: Date.now() },
            },
          };
        }),

      updateContent: (id, content) =>
        set((s) => {
          const n = s.nodes[id];
          if (!n) return s;
          return {
            nodes: {
              ...s.nodes,
              [id]: { ...n, content, updatedAt: Date.now() },
            },
          };
        }),

      getChildren: (parentId) => {
        const { nodes, rootIds } = get();
        if (parentId === null) {
          return rootIds.map((id) => nodes[id]).filter(Boolean);
        }
        return Object.values(nodes)
          .filter((n) => n.parentId === parentId)
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
      },

      getPath: (id) => {
        const { nodes } = get();
        const parts: string[] = [];
        let cur: string | null = id;
        while (cur) {
          const n = nodes[cur];
          if (!n) break;
          parts.unshift(n.name);
          cur = n.parentId;
        }
        return parts.join('/');
      },

      loadStarter: (lang) => {
        const files = STARTERS[lang] || STARTERS.javascript || STARTERS.html;
        const nodes: Record<string, FileNode> = {};
        const rootIds: string[] = [];
        (files || []).forEach((f: any) => {
          const id = uuid();
          nodes[id] = {
            id,
            name: f.name,
            type: 'file',
            parentId: null,
            content: f.content,
            language: f.language,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          rootIds.push(id);
        });
        set({
          nodes,
          rootIds,
          selectedId: rootIds[0] || null,
          expanded: new Set(),
          project: {
            ...get().project,
            language: lang,
            title: lang === 'html' ? 'Xin chào KiteHood 🪁 HTML' : `New ${lang}`,
            updatedAt: Date.now(),
          },
        });
        window.dispatchEvent(new CustomEvent('fs:reset'));
      },

      importNodes: (list, rootIds) => {
        const nodes: Record<string, FileNode> = {};
        list.forEach((n) => {
          if (!n || !n.id) return;
          const name = n.name || 'untitled';
          const isFile = n.type === 'file';
          nodes[n.id] = {
            ...n,
            name,
            type: isFile ? 'file' : 'folder',
            parentId: n.parentId ?? null,
            // Always restore content for files (never drop)
            content: isFile ? (n.content ?? '') : undefined,
            // Re-detect language from filename so CSS/JS linking works after reopen
            language: isFile
              ? n.language && n.language !== 'plaintext'
                ? n.language
                : detectLang(name)
              : undefined,
            createdAt: n.createdAt || Date.now(),
            updatedAt: Date.now(),
          };
        });
        // Fix rootIds: keep provided, or rebuild from parentId === null
        let roots = (rootIds || []).filter((id) => nodes[id]);
        if (roots.length === 0) {
          roots = Object.values(nodes)
            .filter((n) => n.parentId == null)
            .map((n) => n.id);
        }
        const firstFile = Object.values(nodes).find((n) => n.type === 'file');
        set({
          nodes,
          rootIds: roots,
          selectedId: firstFile?.id || roots[0] || null,
          expanded: new Set(
            Object.values(nodes).filter((n) => n.type === 'folder').map((n) => n.id)
          ),
        });
        // Notify preview / UI to refresh links
        queue.dispatchEvent(new CustomEvent('fs:imported'));
      },

      moveNode: (id, newParentId) =>
        set((s) => {
          const n = s.nodes[id];
          if (!n) return s;
          // prevent moving into self/descendant
          if (newParentId === id) return s;
          let cur = newParentId;
          while (cur) {
            if (cur === id) return s;
            cur = s.nodes[cur]?.parentId ?? null;
          }
          const nodes = {
            ...s.nodes,
            [id]: { ...n, parentId: newParentId, updatedAt: Date.now() },
          };
          let rootIds = s.rootIds.filter((r) => r !== id);
          if (newParentId === null && !rootIds.includes(id)) {
            rootIds = [...rootIds, id];
          }
          return { nodes, rootIds };
        }),

      importExternalFiles: (files, parentId = null) => {
        // Flat import – prefer importFileTree for folders
        const entries = files.map((f) => ({
          path: f.name.replace(/\\/g, '/'),
          content: f.content,
        }));
        const result = get().importFileTree(entries);
        return result.fileIds;
      },

      importFileTree: (entries, options) => {
        const expandAll = options?.expandAll !== false;
        const fileIds: string[] = [];
        const newRootIds: string[] = [];

        set((s) => {
          const nodes = { ...s.nodes };
          let rootIds = [...s.rootIds];
          // path segment → folder id cache for this import batch
          const folderCache = new Map<string, string>();

          const ensureFolder = (segments: string[], parentId: string | null): string | null => {
            if (segments.length === 0) return parentId;
            let curParent = parentId;
            let pathSoFar = '';
            for (const seg of segments) {
              pathSoFar = pathSoFar ? pathSoFar + '/' + seg : seg;
              if (folderCache.has(pathSoFar)) {
                curParent = folderCache.get(pathSoFar)!;
                continue;
              }
              // reuse existing folder with same name under parent
              const existing = Object.values(nodes).find(
                (n) => n.type === 'folder' && n.name === seg && n.parentId === curParent
              );
              if (existing) {
                folderCache.set(pathSoFar, existing.id);
                curParent = existing.id;
                continue;
              }
              const id = uuid();
              nodes[id] = {
                id,
                name: seg,
                type: 'folder',
                parentId: curParent,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              if (curParent == null && !rootIds.includes(id)) {
                rootIds.push(id);
                newRootIds.push(id);
              }
              folderCache.set(pathSoFar, id);
              curParent = id;
            }
            return curParent;
          };

          for (const entry of entries) {
            const rel = entry.path.replace(/^\/+/, '').replace(/\\/g, '/');
            if (!rel || rel.endsWith('/')) continue;
            // skip junk
            if (rel.includes('node_modules/') || rel.includes('.git/')) continue;
            const parts = rel.split('/').filter(Boolean);
            if (parts.length === 0) continue;
            const fileName = parts[parts.length - 1];
            const folderParts = parts.slice(0, -1);
            const parentId = ensureFolder(folderParts, null);
            // skip if file with same name already under parent
            const exists = Object.values(nodes).find(
              (n) => n.type === 'file' && n.name === fileName && n.parentId === parentId
            );
            if (exists) {
              // update content
              nodes[exists.id] = {
                ...exists,
                content: entry.content,
                language: detectLang(fileName),
                updatedAt: Date.now(),
              };
              fileIds.push(exists.id);
              continue;
            }
            const id = uuid();
            nodes[id] = {
              id,
              name: fileName,
              type: 'file',
              parentId,
              content: entry.content,
              language: detectLang(fileName),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            if (parentId == null && !rootIds.includes(id)) {
              rootIds.push(id);
              newRootIds.push(id);
            }
            fileIds.push(id);
          }

          const expanded = new Set(s.expanded);
          if (expandAll) {
            Object.values(nodes).forEach((n) => {
              if (n.type === 'folder') expanded.add(n.id);
            });
          }

          return {
            nodes,
            rootIds,
            expanded,
            selectedId: fileIds[0] || s.selectedId,
            project: {
              ...s.project,
              updatedAt: Date.now(),
            },
          };
        });

        return { rootIds: newRootIds, fileIds };
      },

      expandAll: () =>
        set((s) => {
          const expanded = new Set<string>();
          Object.values(s.nodes).forEach((n) => {
            if (n.type === 'folder') expanded.add(n.id);
          });
          return { expanded };
        }),

      clearProject: () => {
        set({
          nodes: {},
          rootIds: [],
          selectedId: null,
          expanded: new Set(),
          project: {
            id: uuid(),
            title: 'Untitled',
            visibility: 'private',
            language: 'html',
            updatedAt: Date.now(),
          },
        });
        window.dispatchEvent(new CustomEvent('fs:reset'));
      },
    }),
    {
      name: 'kitehood-fs-v2',
      partialize: (s) => ({
        project: s.project,
        nodes: s.nodes,
        rootIds: s.rootIds,
        // expanded as array so it survives JSON
        expanded: Array.from(s.expanded),
        selectedId: s.selectedId,
      }),
      merge: (persisted: any, current: any) => {
        const p = persisted || {};
        return {
          ...current,
          ...p,
          expanded: new Set(Array.isArray(p.expanded) ? p.expanded : []),
          nodes: p.nodes && typeof p.nodes === 'object' ? p.nodes : current.nodes,
          rootIds: Array.isArray(p.rootIds) ? p.rootIds : current.rootIds,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!(state.expanded instanceof Set)) {
          state.expanded = new Set(
            Array.isArray((state as any).expanded) ? (state as any).expanded : []
          );
        }
        // Mirror to IndexedDB for larger projects (best-effort)
        try {
          const payload = JSON.stringify({
            project: state.project,
            nodes: state.nodes,
            rootIds: state.rootIds,
            selectedId: state.selectedId,
          });
          if (payload.length < 4_500_000) {
            localStorage.setItem('kitehood-fs-backup', payload);
          }
          if (typeof indexedDB !== 'undefined') {
            const req = indexedDB.open('moi-hoc-code', 1);
            req.onupgradeneeded = () => {
              const db = req.result;
              if (!db.objectStoreNames.contains('fs')) db.createObjectStore('fs');
            };
            req.onsuccess = () => {
              try {
                const db = req.result;
                const tx = db.transaction('fs', 'readwrite');
                tx.objectStore('fs').put(payload, 'snapshot');
              } catch { /* */ }
            };
          }
        } catch { /* quota */ }
      },
    }
  )
);

/** Restore from backup if primary empty (call once at boot) */
export function restoreFsIfEmpty() {
  try {
    const s = useFSStore.getState();
    if (s.rootIds.length > 0 && Object.keys(s.nodes).length > 0) return;
    const raw = localStorage.getItem('kitehood-fs-backup');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.nodes && data?.rootIds?.length) {
      useFSStore.setState({
        project: data.project || s.project,
        nodes: data.nodes,
        rootIds: data.rootIds,
        selectedId: data.selectedId || null,
        expanded: new Set(),
      });
    }
  } catch { /* */ }
}
