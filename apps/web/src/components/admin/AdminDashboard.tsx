import { useState, useEffect } from 'react';
import { Users, Shield, Ban, RefreshCw, Trash2, Unlock } from 'lucide-react';
import { apiFetch } from '../../stores/apiConfig';

type U = {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  provider?: string;
  banned?: boolean;
  ban_reason?: string;
  ban_until?: string;
  avatarUrl?: string;
  created_at?: string;
  last_login_at?: string;
};

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, banned: 0, projects: 0, executions24h: 0 });
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'users'>('users');
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    setMsg('');
    try {
      const [sRes, uRes] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/admin/users'),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      else {
        const j = await sRes.json().catch(() => ({}));
        setMsg('Stats: ' + ((j as any).error || sRes.status));
      }
      if (uRes.ok) {
        const j = await uRes.json();
        setUsers(j.users || []);
        if (!(j.users || []).length) setMsg('Users rong — chua co TK trong KV/D1 hoac token khong phai admin');
      } else {
        const j = await uRes.json().catch(() => ({}));
        setMsg((j as any).error || 'Users HTTP ' + uRes.status + ' (can login admin)');
      }
    } catch (e: any) {
      setMsg(e?.message || 'Loi tai admin');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function banUser(u: U) {
    const reason = prompt('Ly do khoa:', 'Vi pham quy dinh') || 'Banned by admin';
    const hoursStr = prompt('So gio khoa (de trong = vinh vien):', '24');
    const hours = hoursStr ? Number(hoursStr) : undefined;
    const res = await apiFetch('/admin/ban', {
      method: 'POST',
      body: JSON.stringify({
        userId: u.id,
        email: u.email,
        reason,
        hours: hours && hours > 0 ? hours : undefined,
        until: hours && hours > 0 ? null : null,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert((j as any).error || 'Ban failed');
      return;
    }
    alert(
      'Da khoa' +
        ((j as any).ban_until
          ? ' den ' + new Date((j as any).ban_until).toLocaleString('vi-VN')
          : ' (vinh vien)')
    );
    load();
  }

  async function unbanUser(u: U) {
    const res = await apiFetch('/admin/unban', {
      method: 'POST',
      body: JSON.stringify({ userId: u.id, email: u.email }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as any).error || 'Unban failed');
      return;
    }
    load();
  }

  async function deleteUser(u: U) {
    const reason = prompt('Ly do xoa vinh vien:', 'Vi pham nang') || 'Admin da xoa';
    if (!confirm('Xoa vinh vien ' + (u.email || u.id) + '? Email se khong dang ky duoc nua.')) return;
    const res = await apiFetch('/admin/delete-user', {
      method: 'POST',
      body: JSON.stringify({ userId: u.id, email: u.email, reason }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as any).error || 'Delete failed');
      return;
    }
    load();
  }

  function fmt(iso?: string | null) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const p = (n: number) => String(n).padStart(2, '0');
      return `${p(d.getHours())}h${p(d.getMinutes())}p ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return iso;
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-indigo-400" />
          <h1 className="text-2xl font-bold">Admin</h1>
          <button
            type="button"
            onClick={load}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {msg && <p className="mb-4 text-sm text-amber-300">{msg}</p>}

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'overview' ? 'bg-indigo-500' : 'bg-white/10'}`}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'users' ? 'bg-indigo-500' : 'bg-white/10'}`}
            onClick={() => setTab('users')}
          >
            <Users size={14} className="inline mr-1" /> Users ({users.length})
          </button>
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold">{stats.users}</div>
              <div className="text-xs text-slate-400">Users</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-red-400">{stats.banned}</div>
              <div className="text-xs text-slate-400">Banned</div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs text-slate-400">
                <tr>
                  <th className="p-2">User</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Ban</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                            {(u.username || u.email || '?')[0]}
                          </span>
                        )}
                        <div>
                          <div className="font-medium">{u.username || '—'}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-xs">{u.role || 'user'}</td>
                    <td className="p-2 text-xs">
                      {u.banned ? (
                        <span className="text-red-400">
                          Khoa
                          {u.ban_until ? ` den ${fmt(u.ban_until)}` : ' vinh vien'}
                          {u.ban_reason ? ` — ${u.ban_reason}` : ''}
                        </span>
                      ) : (
                        <span className="text-emerald-400">OK</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {!u.banned ? (
                          <button type="button" className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs" onClick={() => banUser(u)}>
                            <Ban size={12} className="inline" /> Khoa
                          </button>
                        ) : (
                          <button type="button" className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs" onClick={() => unbanUser(u)}>
                            <Unlock size={12} className="inline" /> Mo
                          </button>
                        )}
                        <button type="button" className="px-2 py-1 rounded bg-white/10 text-xs" onClick={() => deleteUser(u)}>
                          <Trash2 size={12} className="inline" /> Xoa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      Chua co user — dang ky them TK roi bam Refresh
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
