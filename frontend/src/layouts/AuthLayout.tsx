import { Navigate, Outlet } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';

const AuthLayout = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Flex minHeight="100vh" direction="column">
      <Box flex="1">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default AuthLayout;
