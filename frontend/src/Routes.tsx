import { Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
import { ROUTES } from './shared/route';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import LoginPage from './login/LoginPage';
import Dashboard from './childern-dashboard/pages/Dashboard';
import UnauthorizedPage from './static-pages/UnauthorizedPage';

interface RoutesProps {
  isAuthenticated: boolean;
  onLoginSuccess: (token: string) => void;
}

const Routes = ({ isAuthenticated, onLoginSuccess }: RoutesProps) => {
  return (
    <RouterRoutes>
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
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route
          path={ROUTES.DASHBOARD}
          element={isAuthenticated ? <Dashboard /> : <Navigate to={ROUTES.UNAUTHORIZED} replace />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />}
      />
    </RouterRoutes>
  );
};

export default Routes;
