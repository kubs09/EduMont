import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/route';
import { updateUser } from '../services/api/users';
import { useState } from 'react';
import { useToast } from '@chakra-ui/react';

export const AdmissionWelcome = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        toast({
          title: 'Error',
          description: 'Please log in again',
          status: 'error',
          duration: 5000,
        });
        navigate(ROUTES.LOGIN);
        return;
      }

      const response = await updateUser(parseInt(userId), {
        admission_status: 'in_progress',
      });

      if (response.admission_status === 'in_progress') {
        navigate(ROUTES.ADMISSION_WIZARD);
      } else {
        throw new Error('Failed to update admission status');
      }
    } catch (error: unknown) {
      console.error('Start admission error:', error);

      if ((error as { status?: number }).status === 403) {
        toast({
          title: 'Session Expired',
          description: 'Please log in again',
          status: 'error',
          duration: 5000,
        });
        navigate(ROUTES.LOGIN);
        return;
      }

      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to start admission process',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="center" textAlign="center">
        <Heading as="h1" size="xl" color="brand.primary.800">
          {texts.admissionWelcome.title[language]}
        </Heading>
        <Box>
          <Text fontSize="lg" color="gray.600">
            {texts.admissionWelcome.description[language]}
          </Text>
        </Box>
        <Button
          colorScheme="brand"
          size="lg"
          onClick={handleStart}
          isLoading={isLoading}
          loadingText={texts.admissionWelcome.startButton[language]}
        >
          {texts.admissionWelcome.startButton[language]}
        </Button>
      </VStack>
    </Container>
  );
};
