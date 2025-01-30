import { Heading, Text, Button, Center, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/route';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Center h="100vh">
      <VStack spacing={6}>
        <Heading size="2xl">401</Heading>
        <Heading size="xl">Přístup zamítnut</Heading>
        <Text>Pro přístup k těmto stránkám se prosím přihlašte.</Text>
        <Button colorScheme="blue" onClick={() => navigate(ROUTES.LOGIN)}>
          Přihlásit se
        </Button>
      </VStack>
    </Center>
  );
};

export default UnauthorizedPage;
