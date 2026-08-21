import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 33 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.5 7.1l6.2 5.2C36.8 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

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
    if (user) navigate('/code', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('token')) return;
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
      if (typeof login !== 'function' || typeof register !== 'function') {
        throw new Error('Auth store loi — chua deploy auth.ts moi');
      }
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
        <Link to="/" className="font-bold">
          KiteHood
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-white/5">
          <h1 className="text-xl font-bold mb-4">{mode === 'register' ? 'Tao tai khoan' : 'Dang nhap'}</h1>

          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-2 w-full mb-2 py-2.5 rounded-xl bg-white text-black font-semibold text-sm"
          >
            <GoogleIcon /> Dang nhap voi Google
          </a>
          <a
            href="/api/auth/github"
            className="flex items-center justify-center gap-2 w-full mb-5 py-2.5 rounded-xl bg-[#24292f] font-semibold text-sm border border-white/10"
          >
            <GitHubIcon /> Dang nhap voi GitHub
          </a>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10"
                placeholder="Ten"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              type="email"
              required
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10"
              placeholder="Mat khau"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {err && <p className="text-red-400 text-sm">{err}</p>}
            <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-indigo-500 font-semibold text-sm">
              {busy ? '...' : mode === 'register' ? 'Tao tai khoan' : 'Dang nhap'}
            </button>
          </form>

          <button
            type="button"
            className="mt-4 w-full text-sm text-indigo-300"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'register' ? 'Da co TK? Dang nhap' : 'Chua co TK? Tao tai khoan'}
          </button>
        </div>
      </div>
    </div>
  );
}
