import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
  useColorModeValue,
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';
import { login } from '@frontend/services/api/auth';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { createLoginSchema, LoginFormData } from '../schemas/LoginSchema';
import { ROUTES } from '@frontend/shared/route';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}
const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const iconBg = useColorModeValue('brand.primary.900', 'brand.primary.700');
  const linkColor = useColorModeValue('brand.primary.500', 'brand.primary.300');

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

      localStorage.setItem('token', response.token);
      localStorage.setItem('userName', `${response.firstname} ${response.surname}`);
      localStorage.setItem('userRole', response.role);
      localStorage.setItem('userEmail', response.email);
      localStorage.setItem('userId', response.id.toString());

      onLoginSuccess(response.token);
    } catch (err) {
      const error = err as { status?: number; message?: string };

      if (error.status === 401) {
        setError(texts.auth.signIn.validation.invalidCredentials[language]);
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
        <Circle size="40px" bg={iconBg} color="white">
          <Icon as={LockIcon} />
        </Circle>

        <Heading as="h1" size="lg" color="text-primary">
          {texts.auth.signIn.title[language]}
        </Heading>

        {error && <Text color="red.500">{error}</Text>}

        <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <Input
                type="email"
                placeholder={texts.auth.signIn.emailPlaceholder[language]}
                variant="outline"
                {...register('email')}
              />
              <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <Input
                type="password"
                placeholder={texts.auth.signIn.passwordPlaceholder[language]}
                variant="outline"
                {...register('password')}
              />
              <FormErrorMessage>{errors.password && errors.password.message}</FormErrorMessage>
            </FormControl>

            <Button type="submit" variant="brand" width="100%" mt={4} isLoading={loading}>
              {texts.auth.signIn.loginButton[language]}
            </Button>

            <Button
              variant="link"
              color={linkColor}
              onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            >
              {texts.auth.signIn.forgotPassword[language]}
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default LoginPage;
