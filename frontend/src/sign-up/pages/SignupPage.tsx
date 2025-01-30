import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/route';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { SignupSchema, createSignupSchema } from '../schema';

const SignupPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupSchema>({
    resolver: zodResolver(createSignupSchema(language)),
  });

  const onSubmit = async (data: SignupSchema) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }

      toast({
        title: texts.auth.signUp.success.title[language],
        description: texts.auth.signUp.success.description[language],
        status: 'success',
        duration: 5000,
      });
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast({
        title: texts.auth.signUp.error.title[language],
        description:
          error instanceof Error ? error.message : texts.auth.signUp.error.description[language],
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <VStack spacing={4} width="100%" maxW="400px" mx="auto" mt={8}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <VStack spacing={4}>
          <FormControl isInvalid={!!errors.firstName}>
            <FormLabel>{texts.auth.signUp.firstName[language]}</FormLabel>
            <Input {...register('firstName')} />
            <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.lastName}>
            <FormLabel>{texts.auth.signUp.lastName[language]}</FormLabel>
            <Input {...register('lastName')} />
            <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.email}>
            <FormLabel>{texts.auth.signUp.email[language]}</FormLabel>
            <Input type="email" {...register('email')} />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>{texts.auth.signUp.password[language]}</FormLabel>
            <Input type="password" {...register('password')} />
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>{texts.auth.signUp.confirmPassword[language]}</FormLabel>
            <Input type="password" {...register('confirmPassword')} />
            <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
          </FormControl>

          <Button type="submit" colorScheme="blue" width="100%" isLoading={isSubmitting}>
            {texts.auth.signUp.submitButton[language]}
          </Button>
        </VStack>
      </form>
    </VStack>
  );
};

export default SignupPage;
