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
} from '@chakra-ui/react';
import { texts } from '../texts';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { ROUTES } from '../shared/route';
import { updateUser } from '../services/api';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const userEmail = localStorage.getItem('userEmail') || '';
  const userName = localStorage.getItem('userName') || '';
  const userRole = localStorage.getItem('userRole') || '';
  const userId = parseInt(localStorage.getItem('userId') || '0');
  const [firstName, lastName] = userName.split(' ');

  const [formData, setFormData] = useState({
    firstname: firstName,
    surname: lastName,
    email: userEmail,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (!userId) {
        throw new Error('No user ID found');
      }
      const data = await updateUser(userId, formData);
      localStorage.setItem('userName', `${data.firstname} ${data.surname}`);
      localStorage.setItem('userEmail', data.email);

      toast({
        title: texts.profile.success[language],
        status: 'success',
        duration: 3000,
      });

      navigate(ROUTES.PROFILE);
    } catch (error) {
      toast({
        title: texts.profile.error[language],
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box maxW="container.md" mx="auto" py={8} px={4}>
      <Heading mb={6}>{texts.profile.edit[language]}</Heading>
      <Card>
        <CardBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>{texts.profile.firstName[language]}</FormLabel>
              <Input name="firstname" value={formData.firstname} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>{texts.profile.lastName[language]}</FormLabel>
              <Input name="surname" value={formData.surname} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>{texts.profile.email[language]}</FormLabel>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>{texts.profile.role[language]}</FormLabel>
              <Text>
                {texts.userTable.roles[userRole as keyof typeof texts.userTable.roles][language]}
              </Text>
            </FormControl>
            <ButtonGroup spacing={4}>
              <Button colorScheme="blue" onClick={handleSubmit}>
                {texts.profile.save[language]}
              </Button>
              <Button onClick={() => navigate(ROUTES.PROFILE)}>
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
