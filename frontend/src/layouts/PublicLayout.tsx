import { Navigate, Outlet } from 'react-router-dom';

const PublicLayout = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicLayout;
