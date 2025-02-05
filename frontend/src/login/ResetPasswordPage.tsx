import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  Input,
  VStack,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { z } from 'zod';
import { resetPassword } from '../services/api';
import { texts } from '../texts';
import { useLanguage } from '../shared/contexts/LanguageContext';

const createSchema = (language: 'en' | 'cs') =>
  z
    .object({
      password: z
        .string()
        .min(8, texts.profile.validation.newPasswordLength[language])
        .regex(/[A-Z]/, texts.profile.validation.passwordUppercase[language])
        .regex(/[0-9]/, texts.profile.validation.passwordNumber[language]),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: texts.profile.validation.passwordMatch[language],
      path: ['confirmPassword'],
    });

const ResetPasswordPage = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<ReturnType<typeof createSchema>>>({
    resolver: zodResolver(createSchema(language)),
  });

  const onSubmit = async (data: z.infer<ReturnType<typeof createSchema>>) => {
    const rawToken = searchParams.get('token');
    const token = rawToken?.includes('=') ? rawToken.split('=').pop() : rawToken;

    console.log('Reset attempt:', {
      rawToken,
      cleanToken: token,
      tokenLength: token?.length,
      timestamp: new Date().toISOString(),
    });

    if (!token) {
      toast({
        title: texts.auth.resetPassword.invalidToken[language],
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, data.password);
      toast({
        title: texts.auth.resetPassword.success[language],
        status: 'success',
        duration: 5000,
      });
      navigate('/login');
    } catch (error) {
      console.error('Reset error:', error);
      let errorMessage = texts.auth.resetPassword.error[language];
      if (error instanceof Error) {
        if (error.message.includes('Token is invalid')) {
          errorMessage = texts.auth.resetPassword.invalidToken[language];
        }
      }
      toast({
        title: errorMessage,
        status: 'error',
        duration: 5000,
      });
    }
    setLoading(false);
  };

  return (
    <Container maxW="md">
      <VStack spacing={8} mt={20}>
        <Heading as="h1" size="lg">
          {texts.auth.resetPassword.title[language]}
        </Heading>

        <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.password}>
              <Input
                type="password"
                placeholder={texts.auth.resetPassword.passwordPlaceholder[language]}
                {...register('password')}
              />
              <FormErrorMessage>{errors.password && errors.password.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.confirmPassword}>
              <Input
                type="password"
                placeholder={texts.auth.resetPassword.confirmPasswordPlaceholder[language]}
                {...register('confirmPassword')}
              />
              <FormErrorMessage>
                {errors.confirmPassword && errors.confirmPassword.message}
              </FormErrorMessage>
            </FormControl>

            <Button type="submit" variant="brand" width="100%" mt={4} isLoading={loading}>
              {texts.auth.resetPassword.submitButton[language]}
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default ResetPasswordPage;
