import { Box, Button, Container, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/route';
import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { admissionService } from '../services/api/admission';

export const AdmissionWelcome = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    const checkAdmissionStatus = async () => {
      try {
        const status = await admissionService.getStatus();
        if (status.steps?.length > 0 && status.admission_status === 'in_progress') {
          navigate(ROUTES.ADMISSION_WIZARD);
        }
      } catch (error) {
        console.error('Error checking admission status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkAdmissionStatus();
  }, [navigate]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await admissionService.initializeAdmission();
      navigate(ROUTES.ADMISSION_WIZARD);
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

  if (isCheckingStatus) {
    return (
      <Container maxW="container.md" py={10}>
        <VStack spacing={8} align="center">
          <Spinner size="xl" />
        </VStack>
      </Container>
    );
  }

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
