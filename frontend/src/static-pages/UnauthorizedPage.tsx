import { Heading, Text, Button, Center, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/route';
import { texts } from '../texts';
import { useLanguage } from '../contexts/LanguageContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <Center h="100vh">
      <VStack spacing={6}>
        <Heading size="2xl">{texts.unauthorized.subtitle[language]}</Heading>
        <Heading size="xl">{texts.unauthorized.title[language]}</Heading>
        <Text>{texts.unauthorized.message[language]}</Text>
        <Button colorScheme="blue" onClick={() => navigate(ROUTES.LOGIN)}>
          {texts.unauthorized.loginButton[language]}
        </Button>
      </VStack>
    </Center>
  );
};

export default UnauthorizedPage;
