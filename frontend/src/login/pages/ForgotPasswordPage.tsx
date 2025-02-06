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
} from '@chakra-ui/react';
import { requestPasswordReset } from '../../services/api';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import {
  createForgotPasswordSchema,
  ForgotPasswordFormData,
} from '../schemas/ForgotPasswordSchema';

const ForgotPasswordPage = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(language)),
  });

  const onSubmit = async (data: { email: string }) => {
    if (loading) return; // Prevent multiple submissions
    setLoading(true);
    setSubmitted(false);

    try {
      await requestPasswordReset(data.email, language);
      setSubmitted(true);
      toast({
        title: texts.auth.forgotPassword.success[language],
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
        description: error instanceof Error ? error.message : 'Unknown error occurred',
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
      <VStack spacing={8} mt={20}>
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
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default ForgotPasswordPage;
