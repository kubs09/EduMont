import { Navigate, Outlet } from 'react-router-dom';
import { Box } from '@chakra-ui/react';

const AuthLayout = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box p={4}>
      <Outlet />
    </Box>
  );
};

export default AuthLayout;
