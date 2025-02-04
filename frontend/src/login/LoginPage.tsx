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
  Icon,
  Circle,
  Text,
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';
import { login } from '../services/api';
import { texts } from '../texts';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { createLoginSchema, LoginFormData } from './schema';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { language } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(language)),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await login(data.email.trim(), data.password.trim());
      console.log('Login success:', { role: response.role, id: response.id }); // Debug log

      // Store all user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('userName', `${response.firstname} ${response.surname}`);
      localStorage.setItem('userRole', response.role);
      localStorage.setItem('userEmail', response.email);
      localStorage.setItem('userId', response.id.toString());

      onLoginSuccess(response.token);
    } catch (err) {
      console.error('Login error:', err); // Debug log
      const error = err as { status?: number; message?: string };

      if (error.status === 401) {
        setError(texts.auth.signIn.invalidCredentials[language]);
      } else {
        setError(texts.auth.signIn.serverError[language]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md">
      <VStack spacing={8} mt={20}>
        <Circle size="40px" bg="brand.primary.900" color="white">
          <Icon as={LockIcon} />
        </Circle>

        <Heading as="h1" size="lg">
          {texts.auth.signIn.title[language]}
        </Heading>

        {error && <Text color="red.500">{error}</Text>}

        <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <Input
                type="email"
                placeholder={texts.auth.signIn.emailPlaceholder[language]}
                {...register('email')}
              />
              <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <Input
                type="password"
                placeholder={texts.auth.signIn.passwordPlaceholder[language]}
                {...register('password')}
              />
              <FormErrorMessage>{errors.password && errors.password.message}</FormErrorMessage>
            </FormControl>

            <Button type="submit" variant="brand" width="100%" mt={4} isLoading={loading}>
              {texts.auth.signIn.submitButton[language]}
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default LoginPage;
