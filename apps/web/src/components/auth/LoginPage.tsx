import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || email.split('@')[0]);
      }
      navigate('/code');
    } catch (ex: any) {
      setErr(ex?.message || 'Thất bại');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing-root min-h-screen flex flex-col">
      <header className="h-14 border-b border-white/5 flex items-center px-4 max-w-6xl mx-auto w-full">
        <Link to="/" className="flex items-baseline gap-0.5">
          <span className="brand-kite text-lg text-white">Kite</span>
          <span className="brand-hood text-3xl">Hood</span>
        </Link>
        <Link to="/code" className="ml-auto text-sm text-slate-400 hover:text-white">
          Vào IDE không cần login →
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-md"
        >
          <h1 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Cloud save, VIP (do admin cấp), và tính năng đội nhóm.
          </p>
          {mode === 'register' && (
            <input
              className="w-full mb-3 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"
              placeholder="Tên hiển thị"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            className="w-full mb-3 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            className="w-full mb-4 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm"
          >
            {busy ? '…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
          <button
            type="button"
            className="w-full mt-3 text-sm text-slate-400 hover:text-white"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
