import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth';
import { apiFetch } from '../../stores/apiConfig';
import { Folder, Clock, HardDrive, Activity, FileCode, MapPin } from 'lucide-react';

export function UserDashboard() {
  const user = useAuthStore(s => s.user);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, pr, h, f, e] = await Promise.all([
          apiFetch('/me'),
          apiFetch('/me/projects'),
          apiFetch('/me/login-history'),
          apiFetch('/me/files-recent'),
          apiFetch('/me/executions'),
        ]);
        if (p.ok) setProfile((await p.json()).user);
        if (pr.ok) setProjects((await pr.json()).projects || []);
        if (h.ok) setHistory((await h.json()).history || []);
        if (f.ok) setFiles((await f.json()).files || []);
        if (e.ok) setExecutions((await e.json()).executions || []);
      } catch {
        // API not connected yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const storageUsed = profile?.storage_used ?? user?.storageUsed ?? 0;
  const storageQuota = profile?.storage_quota ?? 1073741824;

  return (
    <div className="p-5 space-y-5 overflow-auto h-full text-sm">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        {loading && <p className="text-[var(--text-secondary)] text-xs mt-0.5">Loading…</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-[var(--text-secondary)] mb-1">
            <Folder size={12} /> Projects
          </div>
          <div className="text-xl font-semibold">{projects.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-[var(--text-secondary)] mb-1">
            <HardDrive size={12} /> Storage
          </div>
          <div className="text-xl font-semibold">
            {(storageUsed / 1024 / 1024).toFixed(1)}
            <span className="text-xs font-normal text-[var(--text-secondary)]"> / {(storageQuota / 1024 / 1024).toFixed(0)} MB</span>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-[var(--text-secondary)] mb-1">
            <Activity size={12} /> Runs
          </div>
          <div className="text-xl font-semibold">{executions.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-[var(--text-secondary)] mb-1">
            <Clock size={12} /> Last login
          </div>
          <div className="text-xs font-medium truncate">
            {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : '—'}
          </div>
        </div>
      </div>

      {/* Recent files (saved on R2) */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1">
          <FileCode size={12} /> Recent saved files
        </h2>
        {files.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-xs">Chưa có file (save qua API → R2)</p>
        ) : (
          <ul className="space-y-1">
            {files.slice(0, 8).map((f: any) => (
              <li key={f.id} className="flex justify-between gap-2 text-xs py-1 border-b border-[var(--border)]">
                <span className="truncate">{f.path || f.name}</span>
                <span className="text-[var(--text-secondary)] shrink-0">
                  {f.updated_at ? new Date(f.updated_at).toLocaleDateString() : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Login history */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1">
          <MapPin size={12} /> Login history
        </h2>
        {history.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-xs">Chưa có lịch sử (login qua API sẽ ghi D1)</p>
        ) : (
          <ul className="space-y-1.5">
            {history.slice(0, 10).map((h: any) => (
              <li key={h.id} className="text-xs border-b border-[var(--border)] pb-1.5">
                <div className="flex justify-between">
                  <span className={h.success ? 'text-emerald-400' : 'text-red-400'}>
                    {h.success ? 'OK' : 'Fail'}
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {h.login_at ? new Date(h.login_at).toLocaleString() : ''}
                  </span>
                </div>
                <div className="text-[var(--text-secondary)] truncate">
                  {[h.city, h.region, h.country].filter(Boolean).join(', ') || h.ip_address || '—'}
                  {' · '}{h.browser} / {h.os} / {h.device}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">Projects</h2>
        {projects.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-xs">Chưa có project</p>
        ) : (
          <ul className="space-y-1">
            {projects.map((p: any) => (
              <li key={p.id} className="flex justify-between text-xs py-1 border-b border-[var(--border)]">
                <span>{p.name}</span>
                <span className="text-[var(--text-secondary)]">{p.language || ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
