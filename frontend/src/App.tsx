import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import { useTheme } from './hooks/useTheme';
import { HomePage } from './pages/HomePage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  useTheme();

  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/sign-in" element={<PublicRoute><SignInPage /></PublicRoute>} />
          <Route path="/sign-up" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
