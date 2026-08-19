import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, FileCode, Folder, FolderOpen,
  FilePlus, FolderPlus, Trash2, Upload, Download, FolderInput,
} from 'lucide-react';
import { useFSStore, FileNode } from '../../stores/fs';
import { usePreviewStore } from '../../stores/preview';
import { useEditorStore } from '../../stores/editor';
import JSZip from 'jszip';

function injectLinkIntoHtml(html: string, href: string, fileName: string): string {
  const isCss = /\.css$/i.test(fileName) || /\.scss$/i.test(fileName);
  const isJs = /\.(js|mjs|cjs)$/i.test(fileName);
  let tag = '';
  if (isCss) tag = `  <link rel="stylesheet" href="${href}" />`;
  else if (isJs) tag = `  <script src="${href}"></script>`;
  else tag = `  <link rel="tab-link" href="${href}" data-name="${fileName}" />`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>\n${tag}\n</head>`);
  }
  return `<!DOCTYPE html>\n<html>\n<head>\n${tag}\n</head>\n<body>\n${html}\n</body>\n</html>`;
}



function ContextMenu({
  x, y, node, onClose,
}: {
  x: number; y: number; node: FileNode | null; onClose: () => void;
}) {
  const { rename, deleteNode, createFile, createFolder, moveNode } = useFSStore();
  const { openTab, closeTab, pruneDeleted } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 200);
  const top = Math.min(y, window.innerHeight - 260);

  const items: { label?: string; action?: () => void; danger?: boolean; sep?: boolean }[] = [];

  if (node) {
    if (node.type === 'file') {
      items.push({ label: 'Open', action: () => openTab(node.id) });
    }
    items.push({
      label: 'Rename',
      action: () => {
        const name = prompt('New name:', node.name);
        if (name && name.trim()) {
          rename(node.id, name.trim());
          useEditorStore.getState().syncFromFS();
        }
      },
    });
    items.push({
      label: 'Delete',
      danger: true,
      action: () => {
        if (confirm(`Delete "${node.name}"?`)) {
          const id = node.id;
          deleteNode(id);
          closeTab(id);
          pruneDeleted([id]);
        }
      },
    });
    if (node.type === 'folder') {
      items.push({ sep: true });
      items.push({
        label: 'New File',
        action: () => {
          const name = prompt('File name (e.g. index.html):');
          if (name) {
            const id = createFile(name, node.id);
            openTab(id);
          }
        },
      });
      items.push({
        label: 'New Folder',
        action: () => {
          const name = prompt('Folder name:');
          if (name) createFolder(name, node.id);
        },
      });
    }
    items.push({ sep: true });
    items.push({
      label: 'Move to root',
      action: () => moveNode(node.id, null),
    });
  } else {
    items.push({
      label: 'New File',
      action: () => {
        const name = prompt('File name:');
        if (name) {
          const id = createFile(name, null);
          openTab(id);
        }
      },
    });
    items.push({
      label: 'New Folder',
      action: () => {
        const name = prompt('Folder name:');
        if (name) createFolder(name, null);
      },
    });
    items.push({ sep: true });
    items.push({
      label: 'Open Files / Folder…',
      action: () => {
        onClose();
        window.dispatchEvent(new CustomEvent('explorer:open-import'));
      },
    });
  }

  return (
    <div
      ref={ref}
      className="fixed z-[10050] min-w-[180px] py-1 rounded-lg border border-[var(--border)] shadow-2xl text-[13px] bg-[var(--bg-secondary)]"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) =>
        it.sep ? (
          <div key={i} className="my-1 border-t border-[var(--border)]" />
        ) : (
          <button
            key={it.label}
            className={`w-full text-left px-3 py-1.5 hover:bg-[var(--hover)] ${it.danger ? 'text-red-400' : ''}`}
            onClick={() => {
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

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const { expanded, toggleExpand, select, selectedId, getChildren } = useFSStore();
  const openTab = useEditorStore((s) => s.openTab);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const children = node.type === 'folder' ? getChildren(node.id) : [];

  return (
    <div data-node>
      <div
        className={`flex items-center gap-1 py-0.5 pr-2 cursor-pointer text-[13px] ${
          isSelected ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'hover:bg-[var(--hover)]'
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => {
          select(node.id);
          if (node.type === 'file') {
            try {
              const prev = usePreviewStore.getState();
              if (prev.linkPickMode) {
                const ed = useEditorStore.getState();
                const fs = useFSStore.getState();
                const tab = ed.tabs.find((x) => x.id === ed.activeTabId);
                const htmlId = tab?.fileId || ed.activeTabId;
                const htmlNode = htmlId ? fs.nodes[htmlId] : null;
                if (htmlNode && htmlNode.type === 'file') {
                  const href = fs.getPath(node.id) || node.name;
                  const next = injectLinkIntoHtml(htmlNode.content || '', href, node.name);
                  fs.updateContent(htmlNode.id, next);
                  prev.setLinkPickMode(false);
                  prev.setOpen(true);
                  prev.requestRefresh();
                  openTab(htmlNode.id);
                  return;
                }
              }
            } catch { /* */ }
            openTab(node.id);
          } else {
            toggleExpand(node.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCtx({ x: e.clientX, y: e.clientY });
        }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/node-id', node.id);
        }}
        onDragOver={(e) => {
          if (node.type === 'folder') e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const id = e.dataTransfer.getData('text/node-id');
          if (id && id !== node.id && node.type === 'folder') {
            useFSStore.getState().moveNode(id, node.id);
          }
        }}
      >
        {node.type === 'folder' ? (
          isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />
        ) : (
          <span className="shrink-0" style={{ width: 14 }} />
        )}
        {node.type === 'folder' ? (
          isOpen ? (
            <FolderOpen size={14} className="text-amber-400 shrink-0" />
          ) : (
            <Folder size={14} className="text-amber-400 shrink-0" />
          )
        ) : (
          <FileCode size={14} className="text-blue-400 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
        {node.type === 'folder' && children.length > 0 && (
          <span className="ml-auto text-[10px] text-[var(--text-secondary)] opacity-60 pr-1">
            {children.length}
          </span>
        )}
      </div>
      {node.type === 'folder' &&
        isOpen &&
        children.map((c) => <TreeNode key={c.id} node={c} depth={depth + 1} />)}
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} node={node} onClose={() => setCtx(null)} />}
    </div>
  );
}

/** Modal: drag-drop zone + pick files / folder */
function OpenFilesModal({ onClose }: { onClose: () => void }) {
  const importFileTree = useFSStore((s) => s.importFileTree);
  const expandAll = useFSStore((s) => s.expandAll);
  const openTab = useEditorStore((s) => s.openTab);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const processFileList = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list);
      if (!files.length) return;
      setStatus(`Reading ${files.length} file(s)…`);
      const entries: { path: string; content: string }[] = [];
      for (const f of files) {
        // webkitRelativePath keeps folder structure when picking a directory
        const path =
          (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
        try {
          const content = await f.text();
          entries.push({ path, content });
        } catch {
          // binary skip or empty
          entries.push({ path, content: '' });
        }
      }
      setStatus(`Importing tree (${entries.length})…`);
      const { fileIds } = importFileTree(entries, { expandAll: true });
      expandAll();
      // Open first few text-ish files
      const toOpen = fileIds.slice(0, 8);
      toOpen.forEach((id) => openTab(id));
      setStatus(`Done — ${fileIds.length} file(s) in project tree`);
      setTimeout(onClose, 500);
    },
    [importFileTree, expandAll, openTab, onClose]
  );

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold">Open Files / Folder</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Giữ cấu trúc thư mục như VS Code. File link (href/src) vẫn hoạt động trong project.
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm px-2">
            Esc
          </button>
        </div>

        <div
          className={`m-5 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging
              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
              : 'border-[var(--border)] bg-[var(--bg-tertiary)]/50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files?.length) {
              processFileList(e.dataTransfer.files);
            }
          }}
        >
          <Upload size={36} className="mx-auto mb-3 text-[var(--accent)] opacity-80" />
          <p className="text-sm font-medium mb-1">Kéo thả file hoặc cả thư mục vào đây</p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Hỗ trợ nhiều file · folder giữ nguyên cây thư mục
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm"
              onClick={() => fileRef.current?.click()}
            >
              Chọn files
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--hover)] flex items-center gap-1.5"
              onClick={() => folderRef.current?.click()}
            >
              <FolderInput size={14} />
              Chọn folder
            </button>
          </div>
          {status && (
            <p className="mt-4 text-xs text-[var(--accent)]">{status}</p>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFileList(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={folderRef}
          type="file"
          // @ts-expect-error webkitdirectory
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFileList(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export function Explorer() {
  const {
    getChildren, createFile, createFolder, deleteNode, selectedId,
    loadStarter, nodes, getPath, expandAll,
  } = useFSStore();
  const { openTab, closeTab, pruneDeleted, closeAll } = useEditorStore();
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const roots = getChildren(null);

  useEffect(() => {
    const onDel = (e: Event) => {
      const ids = (e as CustomEvent).detail as string[];
      pruneDeleted(ids);
    };
    const onReset = () => closeAll();
    const onImport = () => setImportOpen(true);
    window.addEventListener('fs:deleted', onDel);
    window.addEventListener('fs:reset', onReset);
    window.addEventListener('explorer:open-import', onImport);
    return () => {
      window.removeEventListener('fs:deleted', onDel);
      window.removeEventListener('fs:reset', onReset);
      window.removeEventListener('explorer:open-import', onImport);
    };
  }, [pruneDeleted, closeAll]);

  async function handleDownloadZip() {
    const zip = new JSZip();
    Object.values(nodes).forEach((n) => {
      if (n.type === 'file') {
        const path = getPath(n.id) || n.name;
        zip.file(path, n.content || '');
      }
    });
    Object.values(nodes).forEach((n) => {
      if (n.type === 'folder') {
        const path = getPath(n.id);
        if (path) zip.folder(path);
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (useFSStore.getState().project.title || 'project').replace(/\s+/g, '-') + '.zip';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[var(--border)]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex-1 px-1">
          Explorer
        </span>
        <button
          title="Open files / folder"
          className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-secondary)]"
          onClick={() => setImportOpen(true)}
        >
          <Upload size={14} />
        </button>
        <button
          title="Expand all folders"
          className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-secondary)]"
          onClick={() => expandAll()}
        >
          <ChevronDown size={14} />
        </button>
        <button
          title="Download ZIP"
          className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-secondary)]"
          onClick={handleDownloadZip}
        >
          <Download size={14} />
        </button>
        <button
          title="New File"
          className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-secondary)]"
          onClick={() => {
            const name = prompt('File name (e.g. index.html, main.py):');
            if (name) {
              const id = createFile(name, null);
              openTab(id);
            }
          }}
        >
          <FilePlus size={14} />
        </button>
        <button
          title="New Folder"
          className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-secondary)]"
          onClick={() => {
            const name = prompt('Folder name:');
            if (name) createFolder(name, null);
          }}
        >
          <FolderPlus size={14} />
        </button>
        <button
          title="Delete selected"
          className="p-1 rounded hover:bg-[var(--hover)] text-[var(--text-secondary)] hover:text-red-400"
          onClick={() => {
            if (!selectedId) return;
            const node = nodes[selectedId];
            if (node && confirm(`Delete "${node.name}"?`)) {
              deleteNode(selectedId);
              closeTab(selectedId);
              pruneDeleted([selectedId]);
            }
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div
        className="flex-1 overflow-auto py-1"
        onContextMenu={(e) => {
          if ((e.target as HTMLElement).closest('[data-node]')) return;
          e.preventDefault();
          setCtx({ x: e.clientX, y: e.clientY });
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) {
            setImportOpen(true);
            // process after modal mounts – use direct import
            const files = e.dataTransfer.files;
            (async () => {
              const entries: { path: string; content: string }[] = [];
              for (const f of Array.from(files)) {
                const path =
                  (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
                entries.push({ path, content: await f.text() });
              }
              const { fileIds } = useFSStore.getState().importFileTree(entries, { expandAll: true });
              useFSStore.getState().expandAll();
              fileIds.slice(0, 8).forEach((id) => openTab(id));
              setImportOpen(false);
            })();
          }
        }}
      >
        {roots.length === 0 ? (
          <div className="p-4 text-sm text-[var(--text-secondary)] text-center space-y-3">
            <p>Empty project</p>
            <button
              className="w-full py-6 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] text-xs"
              onClick={() => setImportOpen(true)}
            >
              <Upload size={20} className="mx-auto mb-2 opacity-70" />
              Kéo thả hoặc chọn file / folder
            </button>
            <button
              className="text-[var(--accent)] underline text-xs block mx-auto"
              onClick={() => loadStarter('html')}
            >
              Load HTML starter
            </button>
          </div>
        ) : (
          roots.map((n) => <TreeNode key={n.id} node={n} />)
        )}
      </div>

      {ctx && <ContextMenu x={ctx.x} y={ctx.y} node={null} onClose={() => setCtx(null)} />}
      {importOpen && <OpenFilesModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}
