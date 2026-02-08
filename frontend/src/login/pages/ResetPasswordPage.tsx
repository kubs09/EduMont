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
  Card,
  CardBody,
} from '@chakra-ui/react';
import { resetPassword } from '@frontend/services/api/auth';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import {
  createResetPasswordSchema,
  ResetPasswordSchema,
} from '@frontend/login/schemas/ResetPasswordSchema';

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
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(createResetPasswordSchema(language)),
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    const rawToken = searchParams.get('token');
    const token = rawToken?.includes('=') ? rawToken.split('=').pop() : rawToken;

    if (!token) {
      toast({
        title: texts.auth.resetPassword.error.invalidToken[language],
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
      let errorMessage = texts.auth.resetPassword.error[language];
      if (error instanceof Error) {
        if (error.message.includes('Token is invalid')) {
          errorMessage = texts.auth.resetPassword.error.invalidToken[language];
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
      <Card p={8} mt={20} boxShadow="lg" borderRadius="md">
        <CardBody>
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
        </CardBody>
      </Card>
    </Container>
  );
};

export default ResetPasswordPage;
