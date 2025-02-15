import { Navigate, Outlet } from 'react-router-dom';
import { Flex, Box } from '@chakra-ui/react';

const PublicLayout = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Flex minHeight="100vh" direction="column">
      <Box flex="1">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default PublicLayout;
