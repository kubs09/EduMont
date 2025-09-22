import { Heading, Text, Button, Center, VStack, Icon } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/route';
import { texts } from '../texts';
import { useLanguage } from '../shared/contexts/LanguageContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <Center h="100vh">
      <VStack spacing={6}>
        <Icon as={WarningIcon} color="red.500" boxSize={16} />
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
