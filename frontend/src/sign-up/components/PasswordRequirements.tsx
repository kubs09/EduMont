import React from 'react';
import { Box, Text, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';

interface PasswordRequirementsProps {
  password: string;
  isVisible: boolean;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  isVisible,
}) => {
  const { language } = useLanguage();

  const requirements = [
    {
      text: texts.profile.validation.passwordLength[language],
      check: (pass: string) => pass.length >= 8,
    },
    {
      text: texts.profile.validation.passwordUppercase[language],
      check: (pass: string) => /[A-Z]/.test(pass),
    },
    {
      text: texts.profile.validation.passwordNumber[language],
      check: (pass: string) => /[0-9]/.test(pass),
    },
  ];

  return (
    <Box
      position="absolute"
      left={0}
      right={0}
      top={0}
      visibility={isVisible ? 'visible' : 'hidden'}
      opacity={isVisible ? 1 : 0}
      bg="white"
      py={2}
      px={3}
      borderRadius="md"
      height="auto"
      maxH={{ base: '120px', md: '100px' }}
      overflowY="auto"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      transition="opacity 0.2s ease-in-out, visibility 0.2s ease-in-out"
    >
      <Text fontSize="xs" fontWeight="medium" mb={1}>
        {language === 'cs' ? 'Požadavky na heslo:' : 'Password requirements:'}
      </Text>
      <List spacing={0.5}>
        {requirements.map((req, idx) => (
          <ListItem key={idx} fontSize="xs" display="flex" alignItems="center">
            <ListIcon
              as={CheckIcon}
              boxSize="3"
              color={req.check(password || '') ? 'green.500' : 'gray.300'}
            />
            {req.text}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
