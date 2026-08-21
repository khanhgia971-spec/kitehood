import { useAuthStore } from '../../stores/auth';

function fmtVN(iso?: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}h${pad(d.getMinutes())}p ngay ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

export type BanInfo = {
  reason?: string;
  until?: string | null;
  from?: string | null;
};

export function BanLockScreen({ ban }: { ban: BanInfo }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const email = user?.email || 'email@example.com';
  const reason = ban?.reason || 'Vi pham noi quy';
  const fromS = fmtVN(ban?.from) || fmtVN(new Date().toISOString());
  const untilS = fmtVN(ban?.until);

  const unlockText =
    `Tai khoan: ${email}\n` +
    `Xin admin mo khoa tai khoan cua toi.\n` +
    `Thoi gian khoa: tu ${fromS}` +
    (untilS ? ` den ${untilS}` : ' (chua co thoi han mo)') +
    `\nLy do: ${reason}\n` +
    `Cam ket: Toi se tuan thu noi quy, khong tai pham.\nCam on admin.`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[#1a0f12] p-6 text-white shadow-2xl">
        <h2 className="text-xl font-bold text-red-400 mb-2">Tai khoan bi khoa</h2>
        <p className="text-sm text-slate-300 mb-1">
          Khoa tu <b>{fromS}</b>
          {untilS ? (
            <>
              {' '}
              den <b>{untilS}</b>
            </>
          ) : (
            <> (chua hen gio mo)</>
          )}
        </p>
        <p className="text-sm text-slate-400 mb-3">Ly do: {reason}</p>
        <textarea readOnly className="w-full h-32 mb-3 p-2 rounded-lg bg-black/40 border border-white/10 text-xs" value={unlockText} />
        <button
          type="button"
          className="w-full py-2.5 mb-2 rounded-xl bg-indigo-500 font-semibold text-sm"
          onClick={() => {
            navigator.clipboard.writeText(unlockText);
            alert('Da copy noi dung xin mo khoa');
          }}
        >
          Copy noi dung xin mo khoa
        </button>
        <button
          type="button"
          className="w-full py-2.5 rounded-xl border border-white/20 text-sm"
          onClick={() => {
            logout();
            location.href = '/login';
          }}
        >
          Dang xuat
        </button>
      </div>
    </div>
  );
}
