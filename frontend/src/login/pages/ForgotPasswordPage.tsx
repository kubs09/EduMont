import React, { useState } from 'react';
import { useColorModeValue } from "../../components/ui/color-mode";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Container,
  Input,
  VStack,
  Heading,
  Text,
  Card,
  Icon,
  Circle,
  Field,
} from '@chakra-ui/react';
import { FaQuestionCircle } from 'react-icons/fa';
import { requestPasswordReset } from '@frontend/services/api';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import {
  createForgotPasswordSchema,
  ForgotPasswordFormData,
} from '../schemas/ForgotPasswordSchema';
import { useNavigate } from 'react-router';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

const ForgotPasswordPage = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useAppToast();
  const navigate = useNavigate();

  const iconBg = useColorModeValue('brand.primary.900', 'brand.primary.700');

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
        title: texts.login.success.forgotPasswordEmailSent[language],
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      reset();
    } catch (error) {
      console.error('Password reset error:', error);
      setSubmitted(false);
      toast({
        title: texts.login.errors.forgotPasswordFailed[language],
        description: error instanceof Error ? error.message : texts.common.unknownError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md">
      <Card.Root p={8} mt={5} boxShadow="lg" borderRadius="md">
        <VStack gap={8}>
          <Circle size="40px" bg={iconBg} color="white">
            <Box>
              <Icon as={FaQuestionCircle as React.ElementType} w={12} h={12} />
            </Box>
          </Circle>
          <Heading as="h1" size="lg">
            {texts.login.forgotPassword.title[language]}
          </Heading>

          <Text textAlign="center">{texts.login.forgotPassword.description[language]}</Text>

          <Box as="form" w="100%" onSubmit={handleSubmit(onSubmit)}>
            <VStack gap={4}>
              <Field.Root invalid={!!errors.email} disabled={loading || submitted}>
                <Input
                  type="email"
                  placeholder={texts.login.forgotPassword.emailPlaceholder[language]}
                  {...register('email')}
                />
                <Field.ErrorText>{errors.email && errors.email.message}</Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                variant="brand"
                width="100%"
                mt={4}
                loading={loading}
                disabled={submitted}
              >
                {texts.login.forgotPassword.submitButton[language]}
              </Button>

              {submitted && (
                <Text color="green.500" fontSize="sm">
                  {texts.login.forgotPassword.checkEmail[language]}
                </Text>
              )}
              <Button variant="secondary" width="100%" mb={4} onClick={() => navigate('/login')}>
                {texts.login.forgotPassword.backToLogin[language]}
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Card.Root>
    </Container>
  );
};

export default ForgotPasswordPage;
