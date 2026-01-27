import { Heading, Text, Button, Center, VStack, Icon } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@frontend/shared/route';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleButtonClick = () => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <Center h="100vh">
      <VStack spacing={6}>
        <Icon as={WarningIcon} color="red.500" boxSize={16} />
        <Heading size="xl">{texts.unauthorized.title[language]}</Heading>
        <Text>
          {isAuthenticated
            ? texts.unauthorized.backMessage[language]
            : texts.unauthorized.loginMessage[language]}
        </Text>
        <Button colorScheme="blue" onClick={handleButtonClick}>
          {isAuthenticated
            ? texts.unauthorized.backButton[language]
            : texts.unauthorized.loginButton[language]}
        </Button>
      </VStack>
    </Center>
  );
};

export default UnauthorizedPage;
