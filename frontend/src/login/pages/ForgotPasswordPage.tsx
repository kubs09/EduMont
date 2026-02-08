import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Card,
  Icon,
  Circle,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaQuestionCircle } from 'react-icons/fa';
import { requestPasswordReset } from '@frontend/services/api';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import {
  createForgotPasswordSchema,
  ForgotPasswordFormData,
} from '../schemas/ForgotPasswordSchema';
import { useNavigate } from 'react-router';

const ForgotPasswordPage = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const iconBg = useColorModeValue('brand.primary.900', 'brand.primary.700');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(language)),
  });

  const onSubmit = async (data: { email: string }) => {
    if (loading) return;
    setLoading(true);
    setSubmitted(false);

    try {
      await requestPasswordReset(data.email, language);
      setSubmitted(true);
      toast({
        title: texts.auth.forgotPassword.success.title[language],
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      reset();
    } catch (error) {
      console.error('Password reset error:', error);
      setSubmitted(false);
      toast({
        title: texts.auth.forgotPassword.error[language],
        description:
          error instanceof Error
            ? error.message
            : texts.auth.forgotPassword.error.unknown[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md">
      <Card p={8} mt={20} boxShadow="lg" borderRadius="md">
        <VStack spacing={8}>
          <Circle size="40px" bg={iconBg} color="white">
            <Icon as={FaQuestionCircle} />
          </Circle>
          <Heading as="h1" size="lg">
            {texts.auth.forgotPassword.title[language]}
          </Heading>

          <Text textAlign="center">{texts.auth.forgotPassword.description[language]}</Text>

          <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.email} isDisabled={loading || submitted}>
                <Input
                  type="email"
                  placeholder={texts.auth.forgotPassword.emailPlaceholder[language]}
                  {...register('email')}
                />
                <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                variant="brand"
                width="100%"
                mt={4}
                isLoading={loading}
                disabled={submitted}
              >
                {texts.auth.forgotPassword.submitButton[language]}
              </Button>

              {submitted && (
                <Text color="green.500" fontSize="sm">
                  {texts.auth.forgotPassword.checkEmail[language]}
                </Text>
              )}
              <Button variant="secondary" width="100%" mb={4} onClick={() => navigate('/login')}>
                {texts.auth.forgotPassword.backToLogin[language]}
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Card>
    </Container>
  );
};

export default ForgotPasswordPage;
