import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';

export const SignupInstructions: React.FC = () => {
  const { language } = useLanguage();

  return (
    <Box w={{ base: '100%', md: '50%' }} bg="blue.50" p={{ base: 4, md: 6 }} borderRadius={5}>
      <Heading size={{ base: 'lg', md: 'xl' }} color="blue.700" mb={{ base: 2, md: 4 }}>
        {texts.inviteSignup.title[language]}
      </Heading>
      <Text
        fontSize={{ base: 'md', md: 'lg' }}
        fontWeight="medium"
        color="blue.700"
        mb={{ base: 1, md: 3 }}
      >
        {texts.inviteSignup.instructions.title[language]}
      </Text>
      <Text fontSize={{ base: 'sm', md: 'md' }} color="blue.700">
        {texts.inviteSignup.instructions.description[language]}
      </Text>
    </Box>
  );
};
