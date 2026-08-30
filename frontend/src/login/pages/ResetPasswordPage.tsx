import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Input, VStack, Heading, Card, Field } from '@chakra-ui/react';
import { resetPassword } from '@frontend/services/api/auth';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import {
  createResetPasswordSchema,
  ResetPasswordSchema,
} from '@frontend/login/schemas/ResetPasswordSchema';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

const ResetPasswordPage = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useAppToast();

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
        title: texts.login.errors.invalidResetToken[language],
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, data.password);
      toast({
        title: texts.login.success.resetPasswordSuccess[language],
        status: 'success',
        duration: 5000,
      });
      navigate('/login');
    } catch (error) {
      let errorMessage = texts.login.errors.resetPasswordFailed[language];
      if (error instanceof Error) {
        if (error.message.includes('Token is invalid')) {
          errorMessage = texts.login.errors.invalidResetToken[language];
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
      <Card.Root p={8} mt={20} boxShadow="lg" borderRadius="md">
        <Card.Body>
          <VStack gap={8} mt={20}>
            <Heading as="h1" size="lg">
              {texts.login.resetPassword.title[language]}
            </Heading>

            <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
              <VStack gap={4}>
                <Field.Root invalid={!!errors.password}>
                  <Input
                    type="password"
                    placeholder={texts.login.resetPassword.passwordPlaceholder[language]}
                    {...register('password')}
                  />
                  <Field.ErrorText>{errors.password && errors.password.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.confirmPassword}>
                  <Input
                    type="password"
                    placeholder={texts.login.resetPassword.confirmPasswordPlaceholder[language]}
                    {...register('confirmPassword')}
                  />
                  <Field.ErrorText>
                    {errors.confirmPassword && errors.confirmPassword.message}
                  </Field.ErrorText>
                </Field.Root>

                <Button type="submit" variant="brand" width="100%" mt={4} loading={loading}>
                  {texts.login.resetPassword.submitButton[language]}
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Container>
  );
};

export default ResetPasswordPage;
