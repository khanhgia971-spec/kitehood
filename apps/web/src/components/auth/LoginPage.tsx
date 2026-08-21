import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const applyTokenFromUrl = useAuthStore((s) => s.applyTokenFromUrl);
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate('/code', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('token')) return;
    (async () => {
      try {
        await applyTokenFromUrl();
        navigate('/code', { replace: true });
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
      navigate('/code', { replace: true });
    } catch (ex: any) {
      setErr(ex?.message || 'That bai');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-white">
      <header className="h-14 border-b border-white/10 flex items-center px-4">
        <Link to="/" className="font-bold">KiteHood</Link>
        <Link to="/code" className="ml-auto text-sm text-slate-400">Vao IDE</Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-bold mb-1">{mode === 'login' ? 'Dang nhap' : 'Tao tai khoan'}</h1>
          <p className="text-sm text-slate-400 mb-5">Google · GitHub · Email</p>

          <a href="/api/auth/google" className="block w-full mb-2 py-2.5 rounded-xl bg-white text-black text-center font-semibold text-sm">Dang nhap Google</a>
          <a href="/api/auth/github" className="block w-full mb-4 py-2.5 rounded-xl bg-[#24292f] text-center font-semibold text-sm border border-white/10">Dang nhap GitHub</a>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <input className="w-full mb-3 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm" placeholder="Ten hien thi" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input type="email" required className="w-full mb-3 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required className="w-full mb-3 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm" placeholder="Mat khau" value={password} onChange={(e) => setPassword(e.target.value)} />
            {err && <p className="text-red-400 text-sm mb-2">{err}</p>}
            <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-indigo-500 font-semibold text-sm">
              {busy ? '...' : mode === 'login' ? 'Dang nhap' : 'Tao tai khoan'}
            </button>
          </form>

          <button type="button" className="w-full mt-4 text-sm text-indigo-300" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Chua co tai khoan? Tao tai khoan' : 'Da co tai khoan? Dang nhap'}
          </button>
        </div>
      </div>
    </div>
  );
}
