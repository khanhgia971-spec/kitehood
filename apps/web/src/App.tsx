import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.title = 'KiteHood';
  }, []);

  const user = useAuthStore((s) => s.user);
  const ban = useAdminModStore((s) => s.isBanned(user?.id, user?.email));

  return (
    <>
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
