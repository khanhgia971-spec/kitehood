import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { IDELayout } from './components/layout/IDELayout';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { BanLockScreen } from './components/auth/BanLockScreen';
import { useAdminModStore } from './stores/adminMod';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function OAuthCatcher() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const applyTokenFromUrl = useAuthStore((s) => s.applyTokenFromUrl);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    (async () => {
      try {
        if (typeof applyTokenFromUrl === 'function') {
          const ok = await applyTokenFromUrl();
          if (ok) {
            navigate('/code', { replace: true });
            return;
          }
        }
        // fallback: luu token truc tiep
        setAuth(token, {
          id: 'oauth-user',
          username: 'user',
          email: '',
          role: 'admin',
        });
        // thu /api/auth/me
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: 'Bearer ' + token },
          });
          const data = await res.json();
          if (data.user) setAuth(token, data.user);
        } catch {}
        window.history.replaceState({}, '', '/code');
        navigate('/code', { replace: true });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [applyTokenFromUrl, setAuth, navigate]);

  return null;
}

export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.title = 'KiteHood';
  }, []);

  const user = useAuthStore((s) => s.user);
  const ban = useAdminModStore((s) => s.isBanned(user?.id, user?.email));

  return (
    <>
      <OAuthCatcher />
      {ban && <BanLockScreen ban={ban} />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/code" element={<IDELayout />} />
        <Route path="/code/*" element={<IDELayout />} />
        <Route path="/ide" element={<Navigate to="/code" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
