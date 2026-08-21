import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const loginFn = useAuthStore((s) => s.login);
  const registerFn = useAuthStore((s) => s.register);
  const applyTokenFromUrl = useAuthStore((s) => s.applyTokenFromUrl);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('token')) return;
    (async () => {
      try {
        if (typeof applyTokenFromUrl === 'function') {
          await applyTokenFromUrl();
        }
        navigate('/code', { replace: true });
      } catch (ex: any) {
        setErr(ex?.message || 'OAuth loi');
      }
    })();
  }, [applyTokenFromUrl, navigate]);

  async function submit(e: any) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (typeof loginFn !== 'function' || typeof registerFn !== 'function') {
        throw new Error('Auth store loi — deploy lai auth.ts');
      }
      if (mode === 'login') await loginFn(email, password);
      else await registerFn(email, password, name || email.split('@')[0]);
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
        <Link to="/" className="text-white font-bold">KiteHood</Link>
        <Link to="/code" className="ml-auto text-sm text-slate-400">Vao IDE</Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-bold text-white mb-1">{mode === 'login' ? 'Dang nhap' : 'Dang ky'}</h1>
          <p className="text-sm text-slate-400 mb-6">Google · GitHub · Email</p>
          <div className="flex flex-col gap-2 mb-6">
            <a href="/api/auth/google" className="w-full py-2.5 rounded-xl bg-white text-black text-center font-semibold text-sm">Dang nhap voi Google</a>
            <a href="/api/auth/github" className="w-full py-2.5 rounded-xl bg-[#24292f] text-white text-center font-semibold text-sm">Dang nhap voi GitHub</a>
          </div>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <input className="w-full mb-3 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm" placeholder="Ten" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input type="email" required className="w-full mb-3 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required className="w-full mb-4 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm" placeholder="Mat khau" value={password} onChange={(e) => setPassword(e.target.value)} />
            {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
            <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-sm">{busy ? '...' : mode === 'login' ? 'Dang nhap' : 'Dang ky'}</button>
            <button type="button" className="w-full mt-3 text-sm text-slate-400" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Chua co TK? Dang ky' : 'Co TK? Dang nhap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
