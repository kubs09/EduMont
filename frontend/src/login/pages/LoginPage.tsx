import React, { useState } from 'react';
import { useColorModeValue } from '../../shared/contexts/ColorContext';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Container,
  Input,
  VStack,
  Heading,
  Icon,
  Circle,
  Text,
  Card,
  Field,
} from '@chakra-ui/react';
import { FiLock } from 'react-icons/fi';
import { login } from '@frontend/services/api/auth';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { createLoginSchema, LoginFormData } from '../schemas/LoginSchema';
import { ROUTES } from '@frontend/shared/route';
import { LoginPageProps } from '@frontend/types/auth';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const iconBg = useColorModeValue('brand.primary.900', 'brand.primary.700');

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
        setError(texts.login.errors.invalidCredentials[language]);
      } else {
        setError(texts.login.errors.serverError[language]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md">
      <Card.Root p={8} mt={5} boxShadow="lg" borderRadius="md">
        <Card.Body>
          <VStack gap={8}>
            <Circle size="40px" bg={iconBg} color="white">
              <Icon as={FiLock} />
            </Circle>

            <Heading as="h1" size="lg" color="text-primary">
              {texts.login.signIn.title[language]}
            </Heading>

            {error && <Text color="red.500">{error}</Text>}

            <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
              <VStack gap={4}>
                <Field.Root invalid={!!errors.email}>
                  <Input
                    type="email"
                    placeholder={texts.login.signIn.emailPlaceholder[language]}
                    variant="outline"
                    {...register('email')}
                  />
                  <Field.ErrorText>{errors.email && errors.email.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Input
                    type="password"
                    placeholder={texts.login.signIn.passwordPlaceholder[language]}
                    variant="outline"
                    {...register('password')}
                  />
                  <Field.ErrorText>{errors.password && errors.password.message}</Field.ErrorText>
                </Field.Root>

                <Button type="submit" variant="brand" width="100%" mt={4} loading={loading}>
                  {texts.login.signIn.loginButton[language]}
                </Button>

                <Button
                  variant="secondary"
                  width="100%"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                >
                  {texts.login.signIn.forgotPassword[language]}
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Container>
  );
};

export default LoginPage;
