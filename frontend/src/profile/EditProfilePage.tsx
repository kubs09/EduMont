import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Stack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  ButtonGroup,
  FormErrorMessage,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { ROUTES } from '@frontend/shared/route';
import { updateUser } from '@frontend/services/api';
import { createProfileSchema, type ProfileSchema } from '../shared/validation/profileSchema';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
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
        title: texts.profile.success[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate(ROUTES.PROFILE);
    } catch (error) {
      if (error.errors) {
        const validationErrors: Record<string, string> = {};
        error.errors.forEach((err: { path: string[]; message: string }) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
      } else {
        toast({
          title: texts.profile.error[language],
          description: error.message || 'Update failed',
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
      <Card>
        <CardBody>
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.firstname}>
              <FormLabel>{texts.profile.firstName[language]}</FormLabel>
              <Input
                variant="filled"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
              />
              <FormErrorMessage>{errors.firstname}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.surname}>
              <FormLabel>{texts.profile.lastName[language]}</FormLabel>
              <Input
                variant="filled"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
              />
              <FormErrorMessage>{errors.surname}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>{texts.profile.email[language]}</FormLabel>
              <Input
                variant="filled"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.phone}>
              <FormLabel>{texts.profile.phone[language]}</FormLabel>
              <Input
                variant="filled"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
              />
              <FormErrorMessage>{errors.phone}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>{texts.profile.role[language]}</FormLabel>
              <Text>
                {texts.userTable.roles[userRole as keyof typeof texts.userTable.roles][language]}
              </Text>
            </FormControl>
            <ButtonGroup spacing={4}>
              <Button variant="brand" onClick={handleSubmit}>
                {texts.profile.save[language]}
              </Button>
              <Button variant="secondary" onClick={() => navigate(ROUTES.PROFILE)}>
                {texts.profile.cancel[language]}
              </Button>
            </ButtonGroup>
          </Stack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default EditProfilePage;
