import { Navigate, Outlet } from 'react-router-dom';
import { Box, Button, Flex, Heading } from '@chakra-ui/react';

const AuthLayout = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <Box>
      <Flex
        as="header"
        p={4}
        bg="white"
        borderBottomWidth={1}
        justify="space-between"
        align="center"
      >
        <Heading size="lg">Montessori školka - Správa dětí</Heading>
        <Button onClick={handleLogout}>Odhlásit se</Button>
      </Flex>
      <Box p={4}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AuthLayout;
