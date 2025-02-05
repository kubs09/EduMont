import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Stack,
  Text,
  Button,
  useToast,
  Tr,
  Td,
} from '@chakra-ui/react';
import { texts } from '../texts';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { ROUTES } from '../shared/route';
import { getChildren } from '../services/api';
import ProfileChildrenTable from './components/ProfileChildrenTable';
import { Child } from '../types/child';

const ProfilePage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || '';
  const userName = localStorage.getItem('userName') || '';
  const userRole = localStorage.getItem('userRole') || '';
  const [firstName, lastName] = userName.split(' ');
  const [children, setChildren] = useState<Child[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (userRole === 'parent') {
      const fetchChildren = async () => {
        try {
          const data = await getChildren();
          setChildren(data);
        } catch (error) {
          console.error('Failed to fetch children:', error);
          toast({
            title: texts.profile.error[language],
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      };

      fetchChildren();
    }
  }, [userRole, language, toast]);

  return (
    <Box maxW="container.md" mx="auto" py={8} px={4}>
      <Heading mb={6}>{texts.profile.title[language]}</Heading>
      <Card mb={6}>
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
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={() => navigate(ROUTES.PROFILE_CHANGE_PASSWORD)}
            >
              {texts.profile.changePassword[language]}
            </Button>
          </Stack>
        </CardBody>
      </Card>

      {userRole === 'parent' && (
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              {texts.profile.children.title[language]}
            </Heading>
            {children.length > 0 ? (
              <ProfileChildrenTable>
                {children.map((child) => (
                  <Tr key={child.id}>
                    <Td>{child.firstname}</Td>
                    <Td>{child.surname}</Td>
                    <Td>
                      {new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()}
                    </Td>
                    <Td>{child.notes}</Td>
                  </Tr>
                ))}
              </ProfileChildrenTable>
            ) : (
              <Text>{texts.profile.children.noChildren[language]}</Text>
            )}
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default ProfilePage;
