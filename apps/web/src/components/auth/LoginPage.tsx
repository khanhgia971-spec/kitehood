import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const applyTokenFromUrl = useAuthStore((s) => s.applyTokenFromUrl);
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.token || user) navigate('/code', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!new URLSearchParams(location.search).get('token')) return;
    (async () => {
      try {
        await applyTokenFromUrl();
        navigate('/code', { replace: true });
      } catch (e: any) {
        setErr(e?.message || 'OAuth loi');
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
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col">
      <header className="h-12 px-4 flex items-center border-b border-white/10">
        <Link to="/" className="font-bold">KiteHood</Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-white/5">
          <h1 className="text-xl font-bold mb-4">{mode === 'register' ? 'Tao tai khoan' : 'Dang nhap'}</h1>
          <a href="/api/auth/google" className="block mb-2 py-2 rounded-xl bg-white text-black text-center font-semibold text-sm">Google</a>
          <a href="/api/auth/github" className="block mb-4 py-2 rounded-xl bg-zinc-800 text-center font-semibold text-sm">GitHub</a>
          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10" placeholder="Ten" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input type="email" required className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10" placeholder="Mat khau" value={password} onChange={(e) => setPassword(e.target.value)} />
            {err && <p className="text-red-400 text-sm">{err}</p>}
            <button type="submit" disabled={busy} className="w-full py-2 rounded-xl bg-indigo-500 font-semibold">
              {busy ? '...' : mode === 'register' ? 'Tao tai khoan' : 'Dang nhap'}
            </button>
          </form>
          <button type="button" className="mt-4 w-full text-sm text-indigo-300" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'register' ? 'Da co TK? Dang nhap' : 'Chua co TK? Tao tai khoan'}
          </button>
        </div>
      </div>
    </div>
  );
}
