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
  Image,
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';
import { login } from '../../services/api';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { createLoginSchema, LoginFormData } from '../schemas/LoginSchema';
import { ROUTES } from '../../shared/route';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}
const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
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
      onLoginSuccess(response.token);
    } catch (err) {
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
    <Container maxW="4xl">
      <Box
        mt={10}
        borderRadius="xl"
        overflow="hidden"
        boxShadow="lg"
        display={{ base: 'block', md: 'flex' }}
        maxH={{ base: 'auto', md: '500px' }}
      >
        <Box
          display={{ base: 'none', md: 'block' }}
          width={{ md: '45%' }}
          position="relative"
          bg="white"
          borderRightWidth="1px"
          borderColor="brand.primary.200"
        >
          <Image
            src="/assets/education-illustration.svg"
            alt="Education illustration"
            objectFit="contain"
            width="100%"
            height={{ md: '500px' }}
            fallback={
              <Box
                bg="brand.primary.50"
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                color="brand.primary.900"
                fontSize="xl"
                fontWeight="bold"
              >
                <Text>Welcome to EduMont</Text>
              </Box>
            }
          />
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="linear-gradient(to top, rgba(255,255,255,0.95), transparent)"
            p={4}
            textAlign="center"
            color="brand.primary.900"
          >
            <Text fontSize="lg" fontWeight="bold">
              {texts.auth.signIn.welcomeTitle[language]}
            </Text>
            <Text fontSize="sm">{texts.auth.signIn.welcomeSubtitle[language]}</Text>
          </Box>
        </Box>

        <Box
          p={6}
          bg="white"
          width={{ base: '100%', md: '55%' }}
          display="flex"
          alignItems="center"
        >
          <VStack spacing={6} width="100%">
            <Circle
              size="50px"
              bg="brand.primary.900"
              color="white"
              boxShadow="md"
              _hover={{ transform: 'scale(1.05)', transition: '0.2s' }}
            >
              <Icon as={LockIcon} w={5} h={5} />
            </Circle>

            <Heading as="h1" size="md" color="brand.primary.900">
              {texts.auth.signIn.title[language]}
            </Heading>

            {error && (
              <Text
                color="red.500"
                bg="red.50"
                p={3}
                borderRadius="md"
                width="100%"
                textAlign="center"
              >
                {error}
              </Text>
            )}

            <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={3}>
                <FormControl isInvalid={!!errors.email}>
                  <Input
                    type="email"
                    placeholder={texts.auth.signIn.emailPlaceholder[language]}
                    {...register('email')}
                    size="lg"
                    borderColor="brand.primary.200"
                    _hover={{ borderColor: 'brand.primary.300' }}
                    _focus={{ borderColor: 'brand.primary.500', boxShadow: '0 0 0 1px #3182ce' }}
                  />
                  <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <Input
                    type="password"
                    placeholder={texts.auth.signIn.passwordPlaceholder[language]}
                    {...register('password')}
                    size="lg"
                    borderColor="brand.primary.200"
                    _hover={{ borderColor: 'brand.primary.300' }}
                    _focus={{ borderColor: 'brand.primary.500', boxShadow: '0 0 0 1px #3182ce' }}
                  />
                  <FormErrorMessage>{errors.password && errors.password.message}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  variant="brand"
                  width="100%"
                  mt={4}
                  size="lg"
                  isLoading={loading}
                  _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                  transition="all 0.2s"
                >
                  {texts.auth.signIn.submitButton[language]}
                </Button>

                <Button
                  variant="link"
                  color="brand.primary.500"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                  _hover={{ color: 'brand.primary.600', textDecoration: 'underline' }}
                >
                  {texts.auth.signIn.forgotPassword[language]}
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
