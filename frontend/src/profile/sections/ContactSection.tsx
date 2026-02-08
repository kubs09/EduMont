import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Section } from '@frontend/shared/components';

interface ContactSectionProps {
  firstName: string;
  lastName: string;
  userEmail: string;
  userPhone: string;
  userRole: string;
  subtleBg: string;
  onEditProfile: () => void;
}

const ContactSection = ({
  firstName,
  lastName,
  userEmail,
  userPhone,
  userRole,
  subtleBg,
  onEditProfile,
}: ContactSectionProps) => {
  const { language } = useLanguage();

  return (
    <Section title={texts.profile.contactInfo[language]} cardProps={{ mb: 6 }}>
      <Stack spacing={4}>
        <Box bg={subtleBg} p={3} borderRadius="md">
          <Text fontWeight="bold">{texts.profile.firstName[language]}</Text>
          <Text>{firstName}</Text>
        </Box>
        <Box bg={subtleBg} p={3} borderRadius="md">
          <Text fontWeight="bold">{texts.profile.lastName[language]}</Text>
          <Text>{lastName}</Text>
        </Box>
        <Box bg={subtleBg} p={3} borderRadius="md">
          <Text fontWeight="bold">{texts.profile.email[language]}</Text>
          <Text>{userEmail}</Text>
        </Box>
        <Box bg={subtleBg} p={3} borderRadius="md">
          <Text fontWeight="bold">{texts.profile.phone[language]}</Text>
          <Text>{userPhone || '-'}</Text>
        </Box>
        <Box bg={subtleBg} p={3} borderRadius="md">
          <Text fontWeight="bold">{texts.profile.role[language]}</Text>
          <Text>
            {texts.userTable.roles[userRole as keyof typeof texts.userTable.roles][language]}
          </Text>
        </Box>
        <Button variant="brand" onClick={onEditProfile}>
          {texts.profile.edit[language]}
        </Button>
      </Stack>
    </Section>
  );
};

export default ContactSection;
