import { ShieldBan } from 'lucide-react';
import type { BanRecord } from '../../stores/adminMod';

export function BanLockScreen({ ban }: { ban: BanRecord }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ background: 'rgba(7,10,18,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-[#12141c] p-8 text-center shadow-2xl">
        <ShieldBan className="mx-auto text-red-400 mb-4" size={40} />
        <h1 className="text-xl font-bold text-white mb-2">Tài khoản đã bị khóa</h1>
        <p className="text-sm text-slate-400 mb-4">
          Bạn không thể dùng KiteHood cho đến khi admin mở khóa. Làm mới trang vẫn giữ trạng thái khóa.
        </p>
        <div className="text-left text-sm rounded-xl bg-black/30 p-4 border border-white/10 space-y-2">
          <div><span className="text-slate-500">Lý do:</span> <span className="text-red-300">{ban.reason}</span></div>
          <div>
            <span className="text-slate-500">Liên hệ admin:</span>{' '}
            <a className="text-indigo-300 underline" href={`mailto:${ban.contactEmail}`}>
              {ban.contactEmail}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
