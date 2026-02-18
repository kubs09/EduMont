import { Route, Routes as RouterRoutes, Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from './shared/route';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import LoginPage from './login/pages/LoginPage';
import HomePage from './home/HomePage';
import UnauthorizedPage from './static-pages/UnauthorizedPage';
import UserDashboard from './user-dashboard/pages/UserDashboard';
import ProfilePage from './profile/ProfilePage';
import UserProfilePage from './profile/UserProfilePage';
import EditProfilePage from './profile/EditProfilePage';
import InviteSignupPage from './sign-up/SignUpPage';
import ClassesPage from './classes/pages/ClassesPage';
import ForgotPasswordPage from './login/pages/ForgotPasswordPage';
import ResetPasswordPage from './login/pages/ResetPasswordPage';
import Messages from './messages/pages/MessagePage';
import ClassDetailPage from './classes/pages/ClassDetailPage';
import SchedulePage from './schedule/pages/CurriculumPage';
import ChildrenPage from './children/pages/ChildrenPage';
import ChildDetailPage from './children/pages/ChildDetailPage';

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
        <Route path={ROUTES.HOME} element={<HomePage />} />
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
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.REGISTER_INVITE} element={<InviteSignupPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<RequireAuth isAuthenticated={isAuthenticated} />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.MESSAGES} element={<Messages />} />
          <Route path={ROUTES.CLASSES} element={<ClassesPage />} />
          <Route path={ROUTES.CLASS_DETAIL} element={<ClassDetailPage />} />
          <Route path={ROUTES.presentation} element={<SchedulePage />} />
          <Route path={ROUTES.CHILDREN} element={<ChildrenPage />} />
          <Route path={`${ROUTES.CHILDREN}/:id`} element={<ChildDetailPage />} />
          {isAdmin && <Route path={ROUTES.USER_DASHBOARD} element={<UserDashboard />} />}
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.PROFILE_DETAIL} element={<UserProfilePage />} />
          <Route path={ROUTES.PROFILE_EDIT} element={<EditProfilePage />} />
        </Route>
      </Route>

      {/* Catch all route */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? ROUTES.MESSAGES : ROUTES.LOGIN} replace />}
      />
    </RouterRoutes>
  );
};

export default Routes;
