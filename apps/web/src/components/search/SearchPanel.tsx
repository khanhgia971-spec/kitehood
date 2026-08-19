import { useMemo, useState } from 'react';
import { Search, FileCode2 } from 'lucide-react';
import { useFSStore } from '../../stores/fs';
import { useEditorStore } from '../../stores/editor';

type Hit = {
  fileId: string;
  name: string;
  path: string;
  line: number;
  text: string;
  matchStart: number;
  matchLen: number;
};

export function SearchPanel() {
  const [q, setQ] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const nodes = useFSStore((s) => s.nodes);
  const getPath = useFSStore((s) => s.getPath);
  const openTab = useEditorStore((s) => s.openTab);

  const hits = useMemo(() => {
    if (!q.trim()) return [] as Hit[];
    const results: Hit[] = [];
    const needle = caseSensitive ? q : q.toLowerCase();
    for (const n of Object.values(nodes)) {
      if (n.type !== 'file' || !n.content) continue;
      const lines = n.content.split('\n');
      lines.forEach((line, i) => {
        const hay = caseSensitive ? line : line.toLowerCase();
        let from = 0;
        while (true) {
          const idx = hay.indexOf(needle, from);
          if (idx < 0) break;
          results.push({
            fileId: n.id,
            name: n.name,
            path: getPath(n.id) || n.name,
            line: i + 1,
            text: line,
            matchStart: idx,
            matchLen: q.length,
          });
          from = idx + needle.length;
          if (results.length >= 200) return results;
        }
      });
    }
    return results;
  }, [q, caseSensitive, nodes, getPath]);

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-3 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Tìm trong project</span>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nhập từ khóa…"
          className="w-full px-2.5 py-1.5 rounded-lg text-[13px] outline-none"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
          autoFocus
        />
        <label className="flex items-center gap-2 text-[11px] opacity-80 cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Phân biệt hoa/thường
        </label>
        {q && (
          <div className="text-[10px] opacity-60">
            {hits.length >= 200 ? '200+ kết quả (giới hạn)' : `${hits.length} kết quả`}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {hits.map((h, i) => (
          <button
            key={`${h.fileId}-${h.line}-${i}`}
            className="w-full text-left px-3 py-2 border-b hover:bg-[var(--hover)] transition-colors"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => openTab(h.fileId)}
          >
            <div className="flex items-center gap-1.5 text-[11px] opacity-70 mb-0.5">
              <FileCode2 size={12} />
              <span className="truncate">{h.path}</span>
              <span className="ml-auto shrink-0">:{h.line}</span>
            </div>
            <div className="font-mono text-[12px] truncate">
              {h.text.slice(0, h.matchStart)}
              <mark
                style={{
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  borderRadius: 2,
                  padding: '0 1px',
                }}
              >
                {h.text.slice(h.matchStart, h.matchStart + h.matchLen)}
              </mark>
              {h.text.slice(h.matchStart + h.matchLen)}
            </div>
          </button>
        ))}
        {q && !hits.length && (
          <p className="text-xs opacity-50 p-4 text-center">Không tìm thấy.</p>
        )}
        {!q && (
          <p className="text-xs opacity-50 p-4 text-center">
            Tìm kiếm nội dung trong mọi file của project.
          </p>
        )}
      </div>
    </div>
  );
}
