import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return !token ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950 text-sm text-gray-500">Loading DocuMind…</div>}>
      <Routes>
        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><RegisterPage /></PublicRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
