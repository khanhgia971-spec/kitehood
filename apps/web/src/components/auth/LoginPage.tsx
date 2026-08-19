import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const applyTokenFromUrl = useAuthStore((s) => s.applyTokenFromUrl);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ok = await applyTokenFromUrl();
        if (ok) navigate('/code', { replace: true });
      } catch (ex: any) {
        setErr(ex?.message || 'OAuth loi');
      }
    })();
  }, [applyTokenFromUrl, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name || email.split('@')[0]);
      navigate('/code');
    } catch (ex: any) {
      setErr(ex?.message || 'That bai');
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
          Vao IDE khong can login
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-md">
          <h1 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Dang nhap' : 'Tao tai khoan'}
          </h1>
          <p className="text-sm text-slate-400 mb-6">Google · GitHub · Email</p>

          <div className="flex flex-col gap-2 mb-6">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100"
            >
              Dang nhap voi Google
            </a>
            <a
              href="/api/auth/github"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#24292f] text-white font-semibold text-sm hover:bg-[#32383f] border border-white/10"
            >
              Dang nhap voi GitHub
            </a>
          </div>

          <div className="flex items-center gap-3 mb-6 text-xs text-slate-500">
            <div className="flex-1 h-px bg-white/10" />
            hoac email
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <input
                className="w-full mb-3 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm text-white"
                placeholder="Ten hien thi"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              type="email"
              required
              className="w-full mb-3 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm text-white"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm text-white"
              placeholder="Mat khau"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm disabled:opacity-50"
            >
              {busy ? '...' : mode === 'login' ? 'Dang nhap' : 'Dang ky'}
            </button>
            <button
              type="button"
              className="w-full mt-3 text-sm text-slate-400 hover:text-white"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Chua co tai khoan? Dang ky' : 'Da co tai khoan? Dang nhap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
