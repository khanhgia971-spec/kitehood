import { useState } from 'react';
import { X, Sparkles, FolderPlus } from 'lucide-react';
import { TEMPLATES, ProjectTemplate } from '../../lib/templates';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';

type Props = { onClose: () => void };

export function TemplatePicker({ onClose }: Props) {
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const createFile = useFSStore((s) => s.createFile);
  const createFolder = useFSStore((s) => s.createFolder);
  const openTab = useEditorStore((s) => s.openTab);
  const clearProject = useFSStore((s) => s.clearProject);

  const list = TEMPLATES.filter(
    (t) =>
      !filter ||
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      t.tags.some((tag) => tag.includes(filter.toLowerCase())) ||
      t.description.toLowerCase().includes(filter.toLowerCase())
  );

  async function apply(tpl: ProjectTemplate, clearFirst: boolean) {
    setBusy(true);
    try {
      if (clearFirst) {
        if (!confirm('Xóa toàn bộ file hiện tại và nạp template?')) {
          setBusy(false);
          return;
        }
        clearProject();
      }
      const folderMap: Record<string, string | null> = {};
      let firstFileId: string | null = null;

      for (const f of tpl.files) {
        const parts = f.path.split('/');
        let parent: string | null = null;
        // create nested folders
        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts.slice(0, i + 1).join('/');
          if (!folderMap[key]) {
            const id = createFolder(parts[i], parent);
            folderMap[key] = id;
          }
          parent = folderMap[key];
        }
        const fileName = parts[parts.length - 1];
        const id = createFile(fileName, parent, f.content, f.language || 'plaintext');
        if (!firstFileId) firstFileId = id;
      }
      if (firstFileId) openTab(firstFileId);
      window.dispatchEvent(new CustomEvent('moihoccode:sync'));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <Sparkles size={16} className="text-[var(--accent)]" />
          <span className="font-semibold text-sm flex-1">Mẫu dự án (Templates)</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm HTML, Python, React…"
            className="px-2 py-1 text-xs rounded-lg outline-none"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', width: 180 }}
          />
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-3 grid gap-2 sm:grid-cols-2">
          {list.map((t) => (
            <div
              key={t.id}
              className="rounded-xl p-3 border flex flex-col gap-2"
              style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl">{t.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-[11px] opacity-70 line-clamp-2">{t.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 mt-auto">
                <button
                  className="btn-accent flex-1 py-1.5 text-[11px] flex items-center justify-center gap-1"
                  disabled={busy}
                  onClick={() => apply(t, true)}
                >
                  <FolderPlus size={12} /> Nạp mới
                </button>
                <button
                  className="btn-glass flex-1 py-1.5 text-[11px]"
                  disabled={busy}
                  onClick={() => apply(t, false)}
                >
                  Thêm vào project
                </button>
              </div>
            </div>
          ))}
          {!list.length && (
            <p className="text-xs opacity-60 col-span-2 text-center py-8">Không tìm thấy template.</p>
          )}
        </div>
      </div>
    </div>
  );
}
