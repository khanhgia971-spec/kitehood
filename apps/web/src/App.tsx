import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { IDELayout } from './components/layout/IDELayout';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { BanLockScreen } from './components/auth/BanLockScreen';
import { DeletedAccountModal } from './components/auth/DeletedAccountModal';
import { useAdminModStore } from './stores/adminMod';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function OAuthCatcher() {
  const applyTokenFromUrl = useAuthStore((s) => s.applyTokenFromUrl);
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('token')) return;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.location.replace('/code');
    };
    const t = setTimeout(go, 1200);
    (async () => {
      try {
        await applyTokenFromUrl();
      } catch (e) {
        console.error(e);
      } finally {
        clearTimeout(t);
        go();
      }
    })();
  }, [applyTokenFromUrl]);
  return null;
}

export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.title = 'KiteHood';
  }, []);

  const user = useAuthStore((s) => s.user);
  const deletedNotice = useAuthStore((s) => s.deletedNotice);
  const clearDeletedNotice = useAuthStore((s) => s.clearDeletedNotice);
  const logout = useAuthStore((s) => s.logout);
  const banLocal = useAdminModStore((s) => s.isBanned?.(user?.id, user?.email));

  const banInfo =
    user?.banned || banLocal
      ? {
          reason: (user?.banReason as string) || banLocal?.reason || 'Bi khoa',
          until: (user?.banUntil as string) || banLocal?.until || null,
          from: (user?.banFrom as string) || null,
        }
      : null;

  return (
    <>
      <OAuthCatcher />
      {banInfo && <BanLockScreen ban={banInfo} />}
      {deletedNotice && (
        <DeletedAccountModal
          reason={deletedNotice.reason}
          onAccept={() => {
            clearDeletedNotice();
            logout();
            window.location.href = '/';
          }}
        />
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/code" element={<IDELayout />} />
        <Route path="/code/*" element={<IDELayout />} />
        <Route path="/ide" element={<Navigate to="/code" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
