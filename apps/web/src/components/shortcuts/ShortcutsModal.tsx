import { X, Keyboard } from 'lucide-react';

const GROUPS: { title: string; items: { keys: string; desc: string }[] }[] = [
  {
    title: 'Chung',
    items: [
      { keys: 'Ctrl/⌘ + S', desc: 'Lưu project' },
      { keys: 'Ctrl/⌘ + Shift + P', desc: 'Command Palette' },
      { keys: 'Ctrl/⌘ + B', desc: 'Ẩn/hiện Sidebar' },
      { keys: 'Ctrl/⌘ + `', desc: 'Ẩn/hiện Terminal' },
      { keys: 'Ctrl/⌘ + P', desc: 'Mở nhanh file (palette)' },
      { keys: 'Esc', desc: 'Đóng dialog / menu' },
    ],
  },
  {
    title: 'Editor',
    items: [
      { keys: 'Ctrl/⌘ + /', desc: 'Comment dòng' },
      { keys: 'Ctrl/⌘ + D', desc: 'Chọn lần xuất hiện tiếp' },
      { keys: 'Alt + ↑ / ↓', desc: 'Di chuyển dòng' },
      { keys: 'Ctrl/⌘ + F', desc: 'Tìm trong file' },
      { keys: 'Tab', desc: 'Indent / chấp nhận snippet' },
      { keys: '!', desc: 'HTML5 boilerplate (gõ ! rồi Tab)' },
    ],
  },
  {
    title: 'Chạy code',
    items: [
      { keys: 'Run panel → Run', desc: 'HTML → Preview · JS sandbox · khác → Piston' },
      { keys: 'Ctrl/⌘ + Enter', desc: 'Gửi tin AI Agent (khi focus chat)' },
    ],
  },
  {
    title: 'Học tập',
    items: [
      { keys: 'Dạy', desc: 'AI soạn bài giảng trước' },
      { keys: 'Nộp bài · AI chấm', desc: 'Chỉ +XP khi đạt ≥ 60 điểm' },
    ],
  },
];

type Props = { onClose: () => void };

export function ShortcutsModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-auto rounded-2xl"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b sticky top-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <Keyboard size={16} className="text-[var(--accent)]" />
          <span className="font-semibold text-sm flex-1">Phím tắt</span>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-2">
                {g.title}
              </div>
              <div className="space-y-1">
                {g.items.map((it) => (
                  <div
                    key={it.keys}
                    className="flex items-center gap-3 py-1.5 px-2 rounded-lg"
                    style={{ background: 'var(--hover)' }}
                  >
                    <kbd
                      className="text-[11px] font-mono px-2 py-0.5 rounded shrink-0"
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {it.keys}
                    </kbd>
                    <span className="text-[12px]">{it.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
