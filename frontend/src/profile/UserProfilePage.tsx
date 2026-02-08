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
  useToast,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { getUserById } from '@frontend/services/api';
import { User } from '@frontend/types/shared';
import { Section } from '@frontend/shared/components';

const UserProfilePage = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const subtleBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;

      const userId = parseInt(id, 10);
      if (Number.isNaN(userId)) {
        toast({
          title: texts.common.userDashboard.errorTitle[language],
          description: texts.profile.loadError[language],
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
        toast({
          title: texts.common.userDashboard.errorTitle[language],
          description: texts.profile.loadError[language],
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchUser();
  }, [id, language, toast]);

  if (!user) {
    return null;
  }

  return (
    <Container maxW="container.md" mx="auto">
      <Section cardProps={{ mb: 6 }}>
        <Grid templateColumns="auto 1fr auto" alignItems="center" mb={6} gap={2}>
          <GridItem>
            <IconButton
              aria-label={texts.profile.children.backButton[language]}
              icon={<ChevronLeftIcon />}
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
              aria-label={texts.profile.children.backButton[language]}
              icon={<ChevronLeftIcon />}
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
              {texts.userTable.roles[user.role as keyof typeof texts.userTable.roles][language]}
            </Text>
          </Box>
        </Stack>
      </Section>
    </Container>
  );
};

export default UserProfilePage;
