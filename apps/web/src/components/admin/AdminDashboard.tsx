import { useAdminModStore } from '../../stores/adminMod';
import { useState, useEffect } from 'react';
import {
  Users, Shield, Ban, RefreshCw, Trash2, Unlock, Send, FileUp,
} from 'lucide-react';
import { apiFetch } from '../../stores/apiConfig';

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, banned: 0, projects: 0, executions24h: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'users' | 'send'>('overview');
  const [msg, setMsg] = useState('');
  const [sendForm, setSendForm] = useState({
    email: '',
    userId: '',
    filename: 'note.txt',
    content: '',
    message: '',
  });

  async function load() {
    setLoading(true);
    setMsg('');
    try {
      const [sRes, uRes] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/admin/users'),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      else setMsg('Không tải stats (cần role admin + token)');
      if (uRes.ok) setUsers((await uRes.json()).users || []);
      else {
        const j = await uRes.json().catch(() => ({}));
        setMsg((j as any).error || ('Users HTTP ' + uRes.status + ' — can login admin'));
      }
    } catch (e: any) {
      setMsg(e?.message || 'Lỗi tải admin');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function banUser(id: string) {
    const reason = prompt('Lý do khóa tài khoản:', 'Vi phạm quy định') || 'Banned by admin';
    const res = await apiFetch('/admin/ban', {
      method: 'POST',
      body: JSON.stringify({ userId: id, reason, hours: 24 }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as any).error || 'Ban failed');
      return;
    }
    load();
  }

  async function unbanUser(id: string) {
    const res = await apiFetch('/admin/unban', { method: 'POST', body: JSON.stringify({ userId: id }) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as any).error || 'Unban failed');
      return;
    }
    load();
  }

  async function deleteUser(id: string) {
    if (!confirm('Xóa vĩnh viễn tài khoản + dữ liệu sync/inbox?')) return;
    const res = await apiFetch('/admin/delete-user', { method: 'POST', body: JSON.stringify({ userId: id, reason: 'Admin xoa' }) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as any).error || 'Delete failed');
      return;
    }
    load();
  }

  async function sendFile() {
    const res = await apiFetch('/admin/send-file', {
      method: 'POST',
      body: JSON.stringify(sendForm),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert((j as any).error || 'Send failed');
      return;
    }
    setMsg(`Đã gửi file tới user ${(j as any).userId}`);
    setSendForm((s) => ({ ...s, content: '', message: '' }));
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Shield size={20} className="text-[var(--accent)]" /> Admin · KiteHood
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Khóa / xóa acc → KV + D1 · Gửi file inbox cho user
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--hover)]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {msg && <p className="text-sm text-[var(--accent)]">{msg}</p>}

      <div className="flex gap-1 border-b border-[var(--border)]">
        {(['overview', 'users', 'send'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-[var(--accent)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)]'
            }`}
          >
            {t === 'send' ? 'Gửi file' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Users', value: stats.users, icon: Users },
            { label: 'Banned', value: stats.banned, icon: Ban },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-secondary)]"
            >
              <c.icon size={16} className="text-[var(--accent)] mb-2" />
              <div className="text-2xl font-semibold">{c.value}</div>
              <div className="text-xs text-[var(--text-secondary)]">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">User</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                    Chưa có user (hoặc chưa admin token)
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2">
                    <div className="font-medium">{u.username}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{u.email}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">{u.role}</td>
                  <td className="px-4 py-2 text-xs">
                    {u.banned ? (
                      <span className="text-red-400">Khóa · {u.ban_reason || ''}</span>
                    ) : (
                      <span className="text-emerald-400">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right space-x-1">
                    {u.role !== 'admin' && (
                      <>
                        {u.banned ? (
                          <button
                            onClick={() => unbanUser(u.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-emerald-400 hover:bg-emerald-400/10"
                          >
                            <Unlock size={12} /> Mở khóa
                          </button>
                        ) : (
                          <button
                            onClick={() => banUser(u.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10"
                          >
                            <Ban size={12} /> Khóa
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'send' && (
        <div className="max-w-lg space-y-3 rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileUp size={16} className="text-[var(--accent)]" /> Gửi file tới user
          </div>
          <input
            className="w-full px-3 py-2 text-sm"
            placeholder="Email user"
            value={sendForm.email}
            onChange={(e) => setSendForm({ ...sendForm, email: e.target.value })}
          />
          <input
            className="w-full px-3 py-2 text-sm"
            placeholder="Hoặc User ID"
            value={sendForm.userId}
            onChange={(e) => setSendForm({ ...sendForm, userId: e.target.value })}
          />
          <input
            className="w-full px-3 py-2 text-sm"
            placeholder="Tên file (vd: huong-dan.txt)"
            value={sendForm.filename}
            onChange={(e) => setSendForm({ ...sendForm, filename: e.target.value })}
          />
          <input
            className="w-full px-3 py-2 text-sm"
            placeholder="Tin nhắn kèm"
            value={sendForm.message}
            onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
          />
          <textarea
            className="w-full px-3 py-2 text-sm min-h-[120px]"
            placeholder="Nội dung file…"
            value={sendForm.content}
            onChange={(e) => setSendForm({ ...sendForm, content: e.target.value })}
          />
          <button onClick={sendFile} className="btn-accent px-4 py-2 text-sm flex items-center gap-2">
            <Send size={14} /> Gửi vào inbox user
          </button>
        </div>
      )}
      <AdminModTools />
    </div>
  );
}

function AdminModTools() {
  const banUser = useAdminModStore((s) => s.banUser);
  const unbanUser = useAdminModStore((s) => s.unbanUser);
  const grantVip = useAdminModStore((s) => s.grantVip);
  const revokeVip = useAdminModStore((s) => s.revokeVip);
  const bans = useAdminModStore((s) => s.bans);
  const vips = useAdminModStore((s) => s.vips);
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Vi phạm quy định');
  const [contact, setContact] = useState('admin@kitehood.local');
  return (
    <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
      <h2 className="font-semibold text-sm">Khóa tài khoản / VIP (không cần nạp tiền)</h2>
      <p className="text-[11px] opacity-60">Khóa có hiệu lực ngay — user F5 vẫn thấy bảng khóa + lý do + email admin.</p>
      <div className="grid gap-2 text-xs">
        <input className="px-2 py-1 rounded" placeholder="userId" value={uid} onChange={(e) => setUid(e.target.value)} />
        <input className="px-2 py-1 rounded" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="px-2 py-1 rounded" placeholder="Lý do khóa" value={reason} onChange={(e) => setReason(e.target.value)} />
        <input className="px-2 py-1 rounded" placeholder="Email liên hệ admin" value={contact} onChange={(e) => setContact(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-accent text-[11px] px-2 py-1 rounded" onClick={() => banUser({ userId: uid, email, reason, contactEmail: contact })}>Khóa</button>
        <button className="btn-glass text-[11px] px-2 py-1 rounded" onClick={() => unbanUser(uid)}>Mở khóa</button>
        <button className="btn-accent text-[11px] px-2 py-1 rounded" onClick={() => grantVip({ userId: uid, email, note: 'admin grant' })}>Cấp VIP</button>
        <button className="btn-glass text-[11px] px-2 py-1 rounded" onClick={() => revokeVip(uid)}>Thu VIP</button>
      </div>
      <div className="text-[11px] opacity-70">Đang khóa: {bans.length} · VIP: {vips.length}</div>
    </div>
  );
}
