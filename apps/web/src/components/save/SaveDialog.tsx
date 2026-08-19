import { useState, useEffect } from 'react';
import { X, Download, FolderOpen, Trash2, Save } from 'lucide-react';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';
import JSZip from 'jszip';

const SAVED_KEY = 'moihoccode-saved-projects-v2';

type SavedProject = {
  id: string;
  title: string;
  language: string;
  savedAt: number;
  nodes: any[];
  rootIds: string[];
};

function loadSaved(): SavedProject[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) {
      const old = localStorage.getItem('kitehood-saved-projects');
      if (old) {
        localStorage.setItem(SAVED_KEY, old);
        const parsed = JSON.parse(old);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSaved(list: SavedProject[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('save persist failed', e);
    alert('Không lưu được (localStorage đầy?). Thử Download ZIP.');
  }
}

function uid() {
  return `save_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Infer lang from filename so linking works after restore */
function langFromName(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss', less: 'less',
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    json: 'json', md: 'markdown',
    py: 'python', java: 'java', c: 'c', cpp: 'cpp', h: 'c',
    go: 'go', rs: 'rust', php: 'php', rb: 'ruby',
    sql: 'sql', sh: 'shell', bash: 'shell',
  };
  return map[ext] || 'plaintext';
}

export function SaveDialog({ onClose }: { onClose: () => void }) {
  const setProject = useFSStore((s) => s.setProject);
  const importNodes = useFSStore((s) => s.importNodes);
  const openTab = useEditorStore((s) => s.openTab);
  const closeAll = useEditorStore((s) => s.closeAll);
  const tabs = useEditorStore((s) => s.tabs);
  const project = useFSStore((s) => s.project);

  const [title, setTitle] = useState(project.title || 'My Project');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<'save' | 'saved'>('save');
  const [savedList, setSavedList] = useState<SavedProject[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setSavedList(loadSaved());
  }, []);

  /** Fresh snapshot from store — every file keeps full content + correct language */
  function snapshotNodes() {
    const { nodes, rootIds } = useFSStore.getState();
    const list = Object.values(nodes).map((n) => {
      if (n.type === 'file') {
        const lang = n.language && n.language !== 'plaintext' ? n.language : langFromName(n.name);
        return {
          id: n.id,
          name: n.name,
          type: 'file' as const,
          parentId: n.parentId,
          content: n.content ?? '',
          language: lang,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        };
      }
      return {
        id: n.id,
        name: n.name,
        type: 'folder' as const,
        parentId: n.parentId,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      };
    });
    return { list: JSON.parse(JSON.stringify(list)), rootIds: [...rootIds] };
  }

  async function handleSave() {
    const name = (title || project.title || 'Untitled').trim();
    if (!name) {
      setMsg('Nhập tên project');
      return;
    }
    setSaving(true);
    setMsg('');
    setProject({ title: name });

    const { list, rootIds } = snapshotNodes();
    const fileCount = list.filter((n: any) => n.type === 'file').length;

    const entry: SavedProject = {
      id: uid(),
      title: name,
      language: project.language || 'html',
      savedAt: Date.now(),
      nodes: list,
      rootIds,
    };

    const prev = loadSaved();
    const next = [entry, ...prev].slice(0, 80);
    persistSaved(next);
    setSavedList(next);

    tabs.forEach((t) => useEditorStore.getState().markDirty(t.id, false));

    setSuccess(true);
    setMsg(`Đã lưu "${name}" (${fileCount} file) · ${next.length} bản lưu`);
    setSaving(false);
    setTimeout(() => {
      setSuccess(false);
      setTab('saved');
    }, 500);
  }

  async function handleDownloadZip() {
    const { nodes, getPath, project: proj } = useFSStore.getState();
    const zip = new JSZip();
    Object.values(nodes).forEach((n) => {
      if (n.type === 'file') {
        zip.file(getPath(n.id) || n.name, n.content || '');
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(title || proj.title || 'project').replace(/[^\w.-]+/g, '-')}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openSaved(p: SavedProject) {
    closeAll();
    const cloned = JSON.parse(JSON.stringify(p.nodes || [])).map((n: any) => {
      if (n.type === 'file') {
        return {
          ...n,
          content: n.content ?? '',
          language:
            n.language && n.language !== 'plaintext'
              ? n.language
              : langFromName(n.name || ''),
        };
      }
      return n;
    });
    const roots = Array.isArray(p.rootIds) ? [...p.rootIds] : [];
    importNodes(cloned, roots);
    setProject({ id: p.id, title: p.title, language: p.language });

    setTimeout(() => {
      const files = cloned.filter((n: any) => n.type === 'file');
      // Prefer html first so preview has the entry page
      const html =
        files.find((f: any) => /\.html?$/i.test(f.name)) ||
        files.find((f: any) => f.language === 'html');
      const preferred = files.filter((n: any) => roots.includes(n.id));
      const ordered = [
        ...(html ? [html] : []),
        ...preferred.filter((f: any) => f.id !== html?.id),
        ...files.filter((f: any) => f.id !== html?.id && !preferred.some((p: any) => p.id === f.id)),
      ].slice(0, 12);
      ordered.forEach((f: any) => openTab(f.id));
      window.dispatchEvent(new CustomEvent('fs:imported'));
    }, 60);
    onClose();
  }

  function deleteSaved(id: string) {
    const list = loadSaved().filter((p) => p.id !== id);
    persistSaved(list);
    setSavedList(list);
  }

  const fileCount = Object.values(useFSStore.getState().nodes).filter(
    (n) => n.type === 'file'
  ).length;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-end bg-black/45 backdrop-blur-[2px]">
      <div
        className="w-full max-w-[400px] h-full flex flex-col glass-strong"
        style={{ borderRadius: 0, borderLeft: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2 relative z-10">
          <h2 className="text-base font-semibold">Save</h2>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-5 mb-3 relative z-10">
          <button
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'save' ? 'btn-accent' : 'btn-glass'}`}
            onClick={() => setTab('save')}
          >
            Lưu mới
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'saved' ? 'btn-accent' : 'btn-glass'}`}
            onClick={() => {
              setSavedList(loadSaved());
              setTab('saved');
            }}
          >
            Đã lưu ({savedList.length})
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 pb-5 relative z-10">
          {tab === 'save' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  Tên project
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  placeholder="My Project"
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Lưu <b>toàn bộ</b> HTML + CSS + JS (nội dung đầy đủ). Mỗi lần Save = bản mới, không xóa bản cũ.
                <br />
                Hiện <b>{fileCount}</b> file trong project.
              </p>
              {msg && <p className="text-xs text-[var(--accent)]">{msg}</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-accent w-full py-2.5 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Đang lưu…' : success ? 'Đã lưu!' : 'Save Project'}
              </button>
              <button
                onClick={handleDownloadZip}
                className="btn-glass w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download ZIP
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {savedList.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  Chưa có project nào được lưu
                </p>
              ) : (
                savedList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-3 rounded-xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}
                  >
                    <button className="flex-1 text-left min-w-0" onClick={() => openSaved(p)}>
                      <div className="text-sm font-medium truncate">{p.title}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(p.savedAt).toLocaleString()} ·{' '}
                        {(p.nodes || []).filter((n: any) => n.type === 'file').length} files
                      </div>
                    </button>
                    <button title="Open" className="icon-btn" onClick={() => openSaved(p)}>
                      <FolderOpen size={14} />
                    </button>
                    <button
                      title="Delete"
                      className="icon-btn"
                      style={{ color: '#f87171' }}
                      onClick={() => deleteSaved(p.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
