import { useRef, useState } from "react";
import { useAuthStore } from "../../stores/auth";

export function ProfilePanel({ onClose }: { onClose?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);
  const [name, setName] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatarUrl || "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!user) return null;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 400000) { setMsg("Anh max 400KB"); return; }
    const r = new FileReader();
    r.onload = () => setAvatar(String(r.result || ""));
    r.readAsDataURL(f);
  }

  async function save() {
    setBusy(true); setMsg("");
    try {
      await updateProfile({ username: name.trim() || user!.username, avatarUrl: avatar || undefined });
      setMsg("Da luu");
    } catch (ex: any) { setMsg(ex?.message || "Loi"); }
    finally { setBusy(false); }
  }

  return (
    <div className="w-72 rounded-xl border border-white/10 bg-[#12161f] p-4 text-sm text-white shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <button type="button" className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/20" onClick={() => fileRef.current?.click()}>
          {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : <span className="flex h-full items-center justify-center font-bold">{(user.username || "?")[0]}</span>}
        </button>
        <div className="min-w-0">
          <div className="font-semibold truncate">{user.username}</div>
          <div className="text-xs text-slate-400 truncate">{user.email}</div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <input className="w-full mb-2 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ten" />
      <button type="button" disabled={busy} onClick={save} className="w-full py-2 mb-2 rounded-lg bg-indigo-500 font-semibold">{busy ? "..." : "Luu ho so"}</button>
      <button type="button" className="w-full py-2 rounded-lg border border-white/10" onClick={() => { logout(); location.href = "/"; }}>Dang xuat</button>
      {msg && <p className="mt-2 text-xs text-emerald-400">{msg}</p>}
      {onClose && <button type="button" className="mt-2 text-xs text-slate-500 w-full" onClick={onClose}>Dong</button>}
    </div>
  );
}