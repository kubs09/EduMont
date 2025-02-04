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
} from '@chakra-ui/react';
import { texts } from '../texts';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { ROUTES } from '../shared/route';
import { changePassword } from '../services/api';

const ChangePasswordPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const userId = Number(localStorage.getItem('userId'));

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast({
        title: texts.profile.currentPasswordRequired[language],
        status: 'error',
      });
      return;
    }

    if (!newPassword) {
      toast({
        title: texts.profile.newPasswordRequired[language],
        status: 'error',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: texts.profile.passwordsDoNotMatch[language],
        status: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(userId, currentPassword, newPassword);
      toast({
        title: texts.profile.passwordChanged[language],
        status: 'success',
      });
      navigate(ROUTES.PROFILE);
    } catch (error) {
      toast({
        title: texts.profile.passwordError[language],
        status: 'error',
      });
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
              <FormControl isRequired>
                <FormLabel>{texts.profile.currentPassword[language]}</FormLabel>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{texts.profile.newPassword[language]}</FormLabel>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{texts.profile.confirmNewPassword[language]}</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={isSubmitting} w="full">
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
