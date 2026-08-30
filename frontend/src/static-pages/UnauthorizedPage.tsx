import { Heading, Text, Button, Center, VStack, Icon } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';
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
      <VStack gap={6}>
        <Icon as={FiAlertTriangle} color="text-danger" boxSize={16} />
        <Heading size="xl">{texts.staticPages.unauthorizedTitle[language]}</Heading>
        <Text>
          {isAuthenticated
            ? texts.staticPages.backMessage[language]
            : texts.staticPages.loginMessage[language]}
        </Text>
        <Button variant="brand" onClick={handleButtonClick}>
          {isAuthenticated
            ? texts.staticPages.backButton[language]
            : texts.staticPages.loginButton[language]}
        </Button>
      </VStack>
    </Center>
  );
};

export default UnauthorizedPage;
