import { useNavigate } from 'react-router-dom';
import { Box, Card, CardBody, Heading, Stack, Text, Button } from '@chakra-ui/react';
import { texts } from '../texts';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { ROUTES } from '../shared/route';

const ProfilePage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || '';
  const userName = localStorage.getItem('userName') || '';
  const userRole = localStorage.getItem('userRole') || '';
  const [firstName, lastName] = userName.split(' ');

  return (
    <Box maxW="container.md" mx="auto" py={8} px={4}>
      <Heading mb={6}>{texts.profile.title[language]}</Heading>
      <Card>
        <CardBody>
          <Stack spacing={4}>
            <Box>
              <Text fontWeight="bold">{texts.profile.firstName[language]}</Text>
              <Text>{firstName}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.profile.lastName[language]}</Text>
              <Text>{lastName}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.profile.email[language]}</Text>
              <Text>{userEmail}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.profile.role[language]}</Text>
              <Text>
                {texts.userTable.roles[userRole as keyof typeof texts.userTable.roles][language]}
              </Text>
            </Box>
            <Button colorScheme="blue" onClick={() => navigate(ROUTES.PROFILE_EDIT)}>
              {texts.profile.edit[language]}
            </Button>
          </Stack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ProfilePage;
