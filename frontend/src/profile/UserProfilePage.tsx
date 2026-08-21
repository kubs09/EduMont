import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  IconButton,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiChevronLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { getUserById } from '@frontend/services/api';
import { ApiError, User } from '@frontend/types/user';
import { Section } from '@frontend/shared/components';
import { ROUTES } from '@frontend/shared/route';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

const UserProfilePage = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useAppToast();
  const [user, setUser] = useState<User | null>(null);
  const subtleBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;

      const userId = parseInt(id, 10);
      if (Number.isNaN(userId)) {
        toast({
          title: texts.common.genericError.title[language],
          description: texts.common.genericError.description[language],
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      try {
        const response = await getUserById(userId);
        setUser(response);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          navigate(ROUTES.NOT_FOUND);
          return;
        }

        toast({
          title: texts.common.genericError.title[language],
          description: texts.common.genericError.description[language],
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchUser();
  }, [id, language, navigate, toast]);

  if (!user) {
    return null;
  }

  return (
    <Container maxW="container.md" mx="auto">
      <Section cardProps={{ mb: 6 }}>
        <Grid templateColumns="auto 1fr auto" alignItems="center" mb={6} gap={2}>
          <GridItem>
            <IconButton
              aria-label={texts.children.backButton[language]}
              icon={<FiChevronLeft />}
              variant="ghost"
              size={{ base: 'sm', md: 'md' }}
              onClick={() => navigate(-1)}
            />
          </GridItem>
          <GridItem>
            <Heading size={{ base: 'md', md: 'lg' }} textAlign="center">
              {texts.profile.contactInfo[language]}
            </Heading>
          </GridItem>
          <GridItem>
            <IconButton
              aria-label={texts.children.backButton[language]}
              icon={<FiChevronLeft />}
              variant="ghost"
              size={{ base: 'sm', md: 'md' }}
              visibility="hidden"
            />
          </GridItem>
        </Grid>
        <Stack spacing={4}>
          <Box bg={subtleBg} p={3} borderRadius="md">
            <Text fontWeight="bold">{texts.profile.firstName[language]}</Text>
            <Text>{user.firstname}</Text>
          </Box>
          <Box bg={subtleBg} p={3} borderRadius="md">
            <Text fontWeight="bold">{texts.profile.lastName[language]}</Text>
            <Text>{user.surname}</Text>
          </Box>
          <Box bg={subtleBg} p={3} borderRadius="md">
            <Text fontWeight="bold">{texts.profile.email[language]}</Text>
            <Text>{user.email}</Text>
          </Box>
          <Box bg={subtleBg} p={3} borderRadius="md">
            <Text fontWeight="bold">{texts.profile.phone[language]}</Text>
            <Text>{user.phone || '-'}</Text>
          </Box>
          <Box bg={subtleBg} p={3} borderRadius="md">
            <Text fontWeight="bold">{texts.profile.role[language]}</Text>
            <Text>
              {
                texts.userDashboard.table.roles[
                  user.role as keyof typeof texts.userDashboard.table.roles
                ][language]
              }
            </Text>
          </Box>
        </Stack>
      </Section>
    </Container>
  );
};

export default UserProfilePage;
