import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Heading,
  Stack,
  Text,
  Button,
  Input,
  ButtonGroup,
  Field,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { ROUTES } from '@frontend/shared/route';
import { updateUser } from '@frontend/services/api';
import { createProfileSchema, type ProfileSchema } from '../shared/validation/profileSchema';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useAppToast();
  const userEmail = localStorage.getItem('userEmail') || '';
  const userName = localStorage.getItem('userName') || '';
  const userRole = localStorage.getItem('userRole') || '';
  const userId = parseInt(localStorage.getItem('userId') || '0');
  const [firstName, lastName] = userName.split(' ');

  const [formData, setFormData] = useState<ProfileSchema>({
    firstname: firstName,
    surname: lastName,
    email: userEmail,
    phone: localStorage.getItem('userPhone') || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const schema = createProfileSchema(language);
      schema.parse(formData);
      setErrors({});

      if (!userId) {
        throw new Error('No user ID found');
      }

      await updateUser(userId, formData);

      toast({
        title: texts.profile.success.updated[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate(ROUTES.PROFILE);
    } catch (error) {
      if (error.issues) {
        const validationErrors: Record<string, string> = {};
        error.issues.forEach((err: { path: string[]; message: string }) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
      } else {
        toast({
          title: texts.profile.errors.updateFailed.title[language],
          description: error.message || texts.profile.errors.updateFailed.description[language],
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box maxW="container.md" mx="auto" py={8} px={4}>
      <Heading mb={6}>{texts.profile.edit[language]}</Heading>
      <Card.Root>
        <Card.Body>
          <Stack gap={4}>
            <Field.Root required invalid={!!errors.firstname}>
              <Field.Label>{texts.profile.firstName[language]}</Field.Label>
              <Input
                variant="subtle"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
              />
              <Field.ErrorText>{errors.firstname}</Field.ErrorText>
            </Field.Root>
            <Field.Root required invalid={!!errors.surname}>
              <Field.Label>{texts.profile.lastName[language]}</Field.Label>
              <Input
                variant="subtle"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
              />
              <Field.ErrorText>{errors.surname}</Field.ErrorText>
            </Field.Root>
            <Field.Root required invalid={!!errors.email}>
              <Field.Label>{texts.profile.email[language]}</Field.Label>
              <Input
                variant="subtle"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              <Field.ErrorText>{errors.email}</Field.ErrorText>
            </Field.Root>
            <Field.Root invalid={!!errors.phone}>
              <Field.Label>{texts.profile.phone[language]}</Field.Label>
              <Input
                variant="subtle"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
              />
              <Field.ErrorText>{errors.phone}</Field.ErrorText>
            </Field.Root>
            <Field.Root>
              <Field.Label>{texts.profile.role[language]}</Field.Label>
              <Text>
                {
                  texts.userDashboard.table.roles[
                    userRole as keyof typeof texts.userDashboard.table.roles
                  ][language]
                }
              </Text>
            </Field.Root>
            <ButtonGroup gap={4}>
              <Button variant="brand" onClick={handleSubmit}>
                {texts.profile.save[language]}
              </Button>
              <Button variant="secondary" onClick={() => navigate(ROUTES.PROFILE)}>
                {texts.common.cancel[language]}
              </Button>
            </ButtonGroup>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
};

export default EditProfilePage;
