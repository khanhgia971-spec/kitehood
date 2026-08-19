import { useEffect, useState } from 'react';
import { Music2, Play, Square } from 'lucide-react';
import { useMusicStore } from '../../stores/music';

declare global {
  interface Window {
    MusicKit?: any;
  }
}

/**
 * Apple Music via MusicKit JS.
 * Full tracks require:
 * 1) Apple Developer Token (MusicKit)
 * 2) User login + Apple Music subscription
 * Preview-only without subscription — we do not bypass DRM/limits.
 */
export function MusicPanel() {
  const { developerToken, setDeveloperToken, enabled, setEnabled } = useMusicStore();
  const [query, setQuery] = useState('lofi');
  const [status, setStatus] = useState('');
  const [songs, setSongs] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled || !developerToken) return;
    let cancelled = false;
    (async () => {
      try {
        if (!window.MusicKit) {
          setStatus('Đang chờ MusicKit script… F5 nếu cần.');
          return;
        }
        await window.MusicKit.configure({
          developerToken,
          app: { name: 'KiteHood', build: '1.0.0' },
        });
        if (!cancelled) {
          setReady(true);
          setStatus('MusicKit sẵn sàng — đăng nhập Apple Music để nghe full.');
        }
      } catch (e: any) {
        setStatus(e?.message || String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [developerToken, enabled]);

  async function authorize() {
    try {
      const mk = window.MusicKit?.getInstance?.();
      if (!mk) throw new Error('Chưa configure MusicKit');
      await mk.authorize();
      setStatus('Đã ủy quyền Apple Music.');
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  }

  async function search() {
    try {
      const mk = window.MusicKit?.getInstance?.();
      if (!mk) throw new Error('Chưa configure');
      const res = await mk.api.music('/v1/catalog/us/search', {
        term: query,
        types: 'songs',
        limit: 10,
      });
      const data = res?.data?.results?.songs?.data || res?.results?.songs?.data || [];
      setSongs(Array.isArray(data) ? data : []);
      setStatus(`Tìm thấy ${data?.length || 0} bài`);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  }

  async function play(id: string) {
    try {
      const mk = window.MusicKit.getInstance();
      await mk.setQueue({ song: id });
      await mk.play();
      setStatus('Đang phát…');
    } catch (e: any) {
      setStatus(e?.message || String(e));
    }
  }

  async function stop() {
    try {
      window.MusicKit?.getInstance?.()?.stop?.();
    } catch {
      /* */
    }
  }

  return (
    <div className="flex flex-col h-full text-[13px] p-3 gap-2 overflow-auto">
      <div className="flex items-center gap-2 font-semibold">
        <Music2 size={16} className="text-pink-400" /> Apple Music
      </div>
      <p className="text-[11px] opacity-60 leading-relaxed">
        Nghe full bài cần <b>Apple Music subscription</b> + Developer Token (MusicKit) từ tài khoản
        Apple Developer. Không thể phá giới hạn 30s preview trái phép.
      </p>
      <label className="flex items-center gap-2 text-[12px]">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Bật MusicKit
      </label>
      <input
        className="w-full px-2 py-1.5 rounded-lg text-xs font-mono"
        placeholder="Developer Token (JWT)"
        value={developerToken}
        onChange={(e) => setDeveloperToken(e.target.value.trim())}
      />
      <div className="flex gap-1 flex-wrap">
        <button className="btn-glass text-[11px] px-2 py-1 rounded-lg" onClick={() => void authorize()} disabled={!ready}>
          Đăng nhập Apple
        </button>
        <button className="btn-accent text-[11px] px-2 py-1 rounded-lg" onClick={() => void search()} disabled={!ready}>
          Tìm
        </button>
        <button className="btn-glass text-[11px] px-2 py-1 rounded-lg" onClick={() => void stop()}>
          <Square size={12} />
        </button>
      </div>
      <input
        className="w-full px-2 py-1.5 rounded-lg text-xs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm bài hát…"
        onKeyDown={(e) => e.key === 'Enter' && void search()}
      />
      {status && <p className="text-[11px] text-indigo-300">{status}</p>}
      <ul className="space-y-1">
        {songs.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-2 p-2 rounded-lg border border-white/10 hover:bg-white/5"
          >
            <button className="btn-accent p-1.5 rounded-lg" onClick={() => void play(s.id)}>
              <Play size={12} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium">{s.attributes?.name}</div>
              <div className="truncate text-[10px] opacity-50">{s.attributes?.artistName}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
