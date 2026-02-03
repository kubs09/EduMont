import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { ROUTES } from '@frontend/shared/route';
import { changePassword } from '@frontend/services/api';
import { createPasswordChangeSchema, PasswordChangeSchema } from './schemas/passwordSchema';

const ChangePasswordPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const userId = Number(localStorage.getItem('userId'));

  const [formData, setFormData] = useState<PasswordChangeSchema>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const schema = createPasswordChangeSchema(language);
      schema.parse(formData);
      setErrors({});

      setIsSubmitting(true);
      await changePassword(userId, formData.currentPassword, formData.newPassword);
      toast({
        title: texts.profile.passwordChanged[language],
        status: 'success',
      });
      navigate(ROUTES.PROFILE);
    } catch (error) {
      if (error.errors) {
        const validationErrors: Record<string, string> = {};
        interface ZodError {
          path: string[];
          message: string;
        }
        (error.errors as ZodError[]).forEach((err: ZodError) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
        return;
      }
      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          toast({
            title: texts.profile.incorrectCurrentPassword[language],
            status: 'error',
          });
        } else {
          toast({
            title: texts.profile.passwordError[language],
            status: 'error',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box maxW="container.md" mx="auto" py={8} px={4}>
      <Heading mb={6}>{texts.profile.changePassword[language]}</Heading>
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.currentPassword}>
                <FormLabel>{texts.profile.currentPassword[language]}</FormLabel>
                <Input
                  type="password"
                  name="currentPassword"
                  variant="filled"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.newPassword}>
                <FormLabel>{texts.profile.newPassword[language]}</FormLabel>
                <Input
                  type="password"
                  name="newPassword"
                  variant="filled"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>{texts.profile.confirmNewPassword[language]}</FormLabel>
                <Input
                  type="password"
                  name="confirmPassword"
                  variant="filled"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={isSubmitting} w="full">
                {' '}
                {texts.profile.save[language]}
              </Button>
              <Button variant="ghost" onClick={() => navigate(ROUTES.PROFILE)} w="full">
                {texts.profile.cancel[language]}
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ChangePasswordPage;
