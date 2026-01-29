import { Navigate, Outlet, useLocation } from 'react-router-dom';

const PublicLayout = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  const location = useLocation();

  if (isAuthenticated && location.pathname !== '/unauthorized') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicLayout;
