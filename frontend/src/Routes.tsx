import { Route, Routes as RouterRoutes, Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from './shared/route';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import LoginPage from './login/LoginPage';
import Dashboard from './children-dashboard/pages/Dashboard';
import UnauthorizedPage from './static-pages/UnauthorizedPage';
import UserDashboard from './user-dashboard/pages/UserDashboard';
import SignupPage from './sign-up/pages/SignupPage';

interface RoutesProps {
  isAuthenticated: boolean;
  onLoginSuccess: (token: string) => void;
}

const RequireAuth = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }
  return <Outlet />;
};

const Routes = ({ isAuthenticated, onLoginSuccess }: RoutesProps) => {
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

  return (
    <RouterRoutes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route
          path={ROUTES.LOGIN}
          element={
            isAuthenticated ? (
              <Navigate to={ROUTES.DASHBOARD} replace />
            ) : (
              <LoginPage onLoginSuccess={onLoginSuccess} />
            )
          }
        />
        <Route
          path={ROUTES.SIGNUP}
          element={isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <SignupPage />}
        />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<RequireAuth isAuthenticated={isAuthenticated} />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          {isAdmin && <Route path={ROUTES.USER_DASHBOARD} element={<UserDashboard />} />}
        </Route>
      </Route>

      {/* Catch all route */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />}
      />
    </RouterRoutes>
  );
};

export default Routes;
