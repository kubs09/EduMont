import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Card,
  useToast,
  FormErrorMessage,
  Container,
  SimpleGrid,
} from '@chakra-ui/react';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';
import api from '@frontend/services/apiConfig';
import { ROUTES } from '../shared/route';
import { createSignupSchema, type SignupSchema } from './schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { PasswordInput } from './components/PasswordInput';
import { PasswordRequirements } from './components/PasswordRequirements';
import { SignupInstructions } from './components/SignupInstructions';

const InviteSignupPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
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
        title: texts.inviteSignup.success.title[language],
        description: texts.inviteSignup.success.description[language],
        status: 'success',
      });
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast({
        title: texts.inviteSignup.error.title[language],
        description: texts.inviteSignup.error.description[language],
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const watchedPassword = watch('password');

  return (
    <Box
      w="100%"
      minH={{ base: '100vh', md: 'auto' }}
      pb={{ base: '80px', md: 6 }}
      position="relative"
      borderRadius={2}
    >
      <Container
        maxW="container.lg"
        py={{ base: 4, md: 6 }}
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <Card variant="elevated" shadow="lg" overflow="visible" mb={{ base: 4, md: 0 }}>
          <Box display={{ base: 'block', md: 'flex' }} minH={{ base: 'auto', md: '540px' }}>
            <SignupInstructions />

            <Box
              w={{ base: '100%', md: '50%' }}
              p={{ base: 4, md: 6 }}
              display="flex"
              flexDirection="column"
            >
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <Box flex="1">
                  <VStack spacing={3} align="stretch">
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                      <FormControl isRequired isInvalid={!!errors.firstName}>
                        <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>
                          {texts.inviteSignup.form.firstName[language]}
                        </FormLabel>
                        <Input {...register('firstName')} size="sm" />
                        <FormErrorMessage fontSize="xs">
                          {errors.firstName?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isRequired isInvalid={!!errors.lastName}>
                        <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>
                          {texts.inviteSignup.form.lastName[language]}
                        </FormLabel>
                        <Input {...register('lastName')} size="sm" />
                        <FormErrorMessage fontSize="xs">
                          {errors.lastName?.message}
                        </FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <PasswordInput
                      label={texts.inviteSignup.form.password[language]}
                      error={errors.password?.message}
                      registration={register('password')}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                    />

                    <Box
                      w="full"
                      h={{ base: '120px', md: '100px' }}
                      transition="height 0.2s ease-in-out"
                      overflow="hidden"
                      mb={0}
                      position="relative"
                      display={isPasswordFocused ? 'block' : 'none'}
                    >
                      <PasswordRequirements
                        password={watchedPassword}
                        isVisible={isPasswordFocused}
                      />
                    </Box>

                    <PasswordInput
                      label={texts.profile.confirmNewPassword[language]}
                      error={errors.confirmPassword?.message}
                      registration={register('confirmPassword')}
                    />
                  </VStack>
                </Box>

                <Box mt={{ base: 4, md: 'auto' }} pt={{ base: 2, md: 6 }}>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    size="md"
                    isLoading={isLoading}
                  >
                    {texts.inviteSignup.form.submit[language]}
                  </Button>
                </Box>
              </form>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default InviteSignupPage;
