import { useAuthStore } from '../../stores/auth';

export function DeletedAccountModal({ reason, onAccept }: { reason?: string; onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#1a160f] p-6 text-white">
        <h2 className="text-xl font-bold text-amber-300 mb-2">Tai khoan da bi xoa</h2>
        <p className="text-sm text-slate-300 mb-4">Ly do: {reason || 'Admin da xoa tai khoan'}</p>
        <p className="text-xs text-slate-500 mb-4">Email nay se khong dang ky / dang nhap duoc nua.</p>
        <button
          type="button"
          className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold"
          onClick={onAccept}
        >
          Toi chap nhan!
        </button>
      </div>
    </div>
  );
}
