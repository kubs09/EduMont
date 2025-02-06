import { Navigate, Outlet } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { useEffect } from 'react';

const AuthLayout = () => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  useEffect(() => {
    if (token && !userJson) {
      // If we have a token but no user info, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, [token, userJson]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box p={4}>
      <Outlet />
    </Box>
  );
};

export default AuthLayout;
