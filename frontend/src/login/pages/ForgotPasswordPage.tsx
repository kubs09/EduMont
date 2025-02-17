import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Text,
  useToast,
  Flex,
} from '@chakra-ui/react';
import { requestPasswordReset } from '../../services/api';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import {
  createForgotPasswordSchema,
  ForgotPasswordFormData,
} from '../schemas/ForgotPasswordSchema';
import { ChevronLeftIcon } from '@chakra-ui/icons';

const ForgotPasswordPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(language)),
  });

  const onSubmit = async (data: { email: string }) => {
    if (loading) return;
    setLoading(true);
    setSubmitted(false);

    try {
      await requestPasswordReset(data.email, language);
      setSubmitted(true);
      toast({
        title: texts.auth.forgotPassword.success[language],
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      reset();
    } catch (error) {
      console.error('Password reset error:', error);
      setSubmitted(false);
      toast({
        title: texts.auth.forgotPassword.error[language],
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex width="100%" minHeight="100vh" justifyContent="center" alignItems="center">
      <Container maxW="md" px={8}>
        <Button
          leftIcon={<ChevronLeftIcon />}
          m={4}
          variant="ghost"
          alignSelf="flex-start"
          color="brand.primary.900"
          _dark={{ color: 'brand.primary.700' }}
          onClick={() => navigate(-1)}
          size="sm"
        >
          {texts.auth.forgotPassword.backButton[language]}
        </Button>
        <Box
          bg="bg.app"
          backdropFilter="blur(10px)"
          borderRadius="xl"
          p={8}
          boxShadow="xl"
          border="1px solid"
          borderColor="whiteAlpha.300"
        >
          <VStack spacing={8}>
            <Heading as="h1" size="lg" bg="gradient.title" bgClip="text">
              {texts.auth.forgotPassword.title[language]}
            </Heading>

            <Text textAlign="center">{texts.auth.forgotPassword.description[language]}</Text>

            <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.email} isDisabled={loading || submitted}>
                  <Input
                    type="email"
                    placeholder={texts.auth.forgotPassword.emailPlaceholder[language]}
                    bg="whiteAlpha.900"
                    _dark={{ bg: 'whiteAlpha.100' }}
                    {...register('email')}
                  />
                  <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  width="100%"
                  mt={4}
                  isLoading={loading}
                  disabled={submitted}
                  bg="gradient.primary"
                  color="white"
                  _hover={{
                    bg: 'gradient.primary',
                    opacity: 0.9,
                  }}
                >
                  {texts.auth.forgotPassword.submitButton[language]}
                </Button>

                {submitted && (
                  <Text color="green.500" fontSize="sm">
                    {texts.auth.forgotPassword.checkEmail[language]}
                  </Text>
                )}
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
};

export default ForgotPasswordPage;
