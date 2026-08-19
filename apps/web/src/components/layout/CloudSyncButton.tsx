import { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { pushToCloud, pullFromCloud } from '../../lib/cloudSync';

export function CloudSyncButton() {
  const token = useAuthStore((s) => s.token);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (!token) {
    return (
      <span className="text-[10px] opacity-50 px-1" title="Đăng nhập để sync D1/KV">
        Local only
      </span>
    );
  }

  async function run(fn: () => Promise<unknown>, label: string) {
    setBusy(true);
    setMsg(label);
    try {
      await fn();
      setMsg('OK');
      setTimeout(() => setMsg(''), 1500);
    } catch (e: any) {
      setMsg(e?.message || 'Lỗi');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Cloud size={13} className="text-[var(--accent)] opacity-80" />
      <button
        className="btn-glass px-1.5 py-0.5 text-[10px] flex items-center gap-0.5"
        disabled={busy}
        title="Tải từ Cloudflare KV/D1"
        onClick={() => run(pullFromCloud, 'Pull…')}
      >
        {busy ? <Loader2 size={11} className="animate-spin" /> : <CloudDownload size={11} />}
        Pull
      </button>
      <button
        className="btn-glass px-1.5 py-0.5 text-[10px] flex items-center gap-0.5"
        disabled={busy}
        title="Đẩy lên Cloudflare KV/D1"
        onClick={() => run(pushToCloud, 'Push…')}
      >
        <CloudUpload size={11} />
        Push
      </button>
      {msg && <span className="text-[10px] text-[var(--accent)] max-w-[100px] truncate">{msg}</span>}
    </div>
  );
}
