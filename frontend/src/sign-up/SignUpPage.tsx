import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, VStack, Card, Heading, Text, Container, Field } from '@chakra-ui/react';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import api from '@frontend/services/apiConfig';
import { ROUTES } from '@frontend/shared/route';
import { createSignupSchema, type SignupSchema } from './schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

const InviteSignupPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useAppToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(createSignupSchema(language)),
  });

  const onSubmit = async (data: SignupSchema) => {
    setIsLoading(true);
    try {
      await api.post(`/api/users/register/${token}`, {
        firstname: data.firstName,
        surname: data.lastName,
        password: data.password,
      });
      toast({
        title: texts.signUp.success.registered.title[language],
        description: texts.signUp.success.registered.description[language],
        status: 'success',
      });
      navigate(ROUTES.LOGIN);
    } catch {
      toast({
        title: texts.signUp.errors.registrationFailed.title[language],
        description: texts.signUp.errors.registrationFailed.description[language],
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="lg">
      <Card.Root p={8} mt={5} boxShadow="lg" borderRadius="md">
        <Card.Header>
          <Heading>{texts.signUp.title[language]}</Heading>
        </Card.Header>
        <Text textAlign="center">{texts.signUp.description[language]}</Text>
        <Card.Body>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <VStack gap={4}>
              <Field.Root required invalid={!!errors.firstName}>
                <Field.Label>{texts.signUp.form.firstName[language]}</Field.Label>
                <Input {...register('firstName')} />
                <Field.ErrorText>{errors.firstName?.message}</Field.ErrorText>
              </Field.Root>
              <Field.Root required invalid={!!errors.lastName}>
                <Field.Label>{texts.signUp.form.lastName[language]}</Field.Label>
                <Input {...register('lastName')} />
                <Field.ErrorText>{errors.lastName?.message}</Field.ErrorText>
              </Field.Root>
              <Field.Root required invalid={!!errors.password}>
                <Field.Label>{texts.signUp.form.password[language]}</Field.Label>
                <Input type="password" {...register('password')} />
                <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
              </Field.Root>
              <Field.Root required invalid={!!errors.confirmPassword}>
                <Field.Label>{texts.profile.confirmNewPassword[language]}</Field.Label>
                <Input type="password" {...register('confirmPassword')} />
                <Field.ErrorText>{errors.confirmPassword?.message}</Field.ErrorText>
              </Field.Root>
              <Button mt={5} type="submit" variant="brand" width="full" loading={isLoading}>
                {texts.signUp.form.submit[language]}
              </Button>
            </VStack>
          </form>
        </Card.Body>
      </Card.Root>
    </Container>
  );
};

export default InviteSignupPage;
