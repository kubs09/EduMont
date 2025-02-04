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
  CardBody,
  CardHeader,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import api from '../../services/api';
import { ROUTES } from '../../shared/route';

const InviteSignupPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstname: formData.get('firstname') as string,
      surname: formData.get('surname') as string,
      password: formData.get('password') as string,
    };

    try {
      await api.post(`/api/users/register/${token}`, data);
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

  return (
    <Box p={6}>
      <Card>
        <CardHeader>
          <Heading>{texts.inviteSignup.title[language]}</Heading>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>{texts.inviteSignup.form.firstName[language]}</FormLabel>
                <Input name="firstname" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{texts.inviteSignup.form.lastName[language]}</FormLabel>
                <Input name="surname" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{texts.inviteSignup.form.password[language]}</FormLabel>
                <Input name="password" type="password" />
              </FormControl>
              <Button type="submit" colorScheme="blue" width="full" isLoading={isLoading}>
                {texts.inviteSignup.form.submit[language]}
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
};

export default InviteSignupPage;
