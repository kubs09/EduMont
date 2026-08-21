import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useToast,
  Text,
  FormErrorMessage,
  Container,
} from '@chakra-ui/react';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import api from '@frontend/services/apiConfig';
import { ROUTES } from '@frontend/shared/route';
import { createSignupSchema, type SignupSchema } from './schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const InviteSignupPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
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
      <Card p={8} mt={5} boxShadow="lg" borderRadius="md">
        <CardHeader>
          <Heading>{texts.signUp.title[language]}</Heading>
        </CardHeader>
        <Text textAlign="center">{texts.signUp.description[language]}</Text>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.firstName}>
                <FormLabel>{texts.signUp.form.firstName[language]}</FormLabel>
                <Input {...register('firstName')} />
                <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.lastName}>
                <FormLabel>{texts.signUp.form.lastName[language]}</FormLabel>
                <Input {...register('lastName')} />
                <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.password}>
                <FormLabel>{texts.signUp.form.password[language]}</FormLabel>
                <Input type="password" {...register('password')} />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                <FormLabel>{texts.profile.confirmNewPassword[language]}</FormLabel>
                <Input type="password" {...register('confirmPassword')} />
                <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
              </FormControl>
              <Button mt={5} type="submit" colorScheme="blue" width="full" isLoading={isLoading}>
                {texts.signUp.form.submit[language]}
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
};

export default InviteSignupPage;
