import React from 'react';
import { VStack, HStack, Text, IconButton, Button, Box } from '@chakra-ui/react';
import { DeleteIcon, EmailIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';
import { Message } from '../types/message';

interface MessageDetailProps {
  message: Message | null;
  onDelete: (id: number) => void;
  onCompose: () => void;
  translations: {
    from: string;
    to: string;
    title: string;
    compose: string;
  };
}

const MessageDetail: React.FC<MessageDetailProps> = ({
  message,
  onDelete,
  onCompose,
  translations,
}) => {
  if (!message) {
    return (
      <VStack h="100%" justify="center" spacing={{ base: 3, md: 4 }}>
        <EmailIcon boxSize={{ base: 12, md: 16 }} color="gray.400" />
        <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.500" textAlign="center">
          {translations.title}
        </Text>
        <Button
          leftIcon={<EmailIcon />}
          size={{ base: 'sm', md: 'md' }}
          colorScheme="blue"
          onClick={onCompose}
        >
          {translations.compose}
        </Button>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={{ base: 4, md: 6 }} h="100%">
      <VStack
        align="stretch"
        spacing={{ base: 2, md: 3 }}
        p={{ base: 3, md: 4 }}
        bg="gray.50"
        borderRadius="md"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <HStack justify="space-between" spacing={{ base: 2, sm: 3 }} align="center">
          <Text
            fontSize={{ base: 'md', sm: 'lg', md: '2xl' }}
            fontWeight="semibold"
            noOfLines={{ base: 2, md: 1 }}
            flex="1"
          >
            {message.subject}
          </Text>
          <IconButton
            flexShrink={0}
            size={{ base: 'sm', md: 'md' }}
            icon={<DeleteIcon />}
            aria-label="Delete"
            onClick={() => onDelete(message.id)}
            colorScheme="red"
            variant="ghost"
          />
        </HStack>

        <VStack
          align="stretch"
          spacing={{ base: 0.5, md: 1 }}
          pt={{ base: 1, md: 2 }}
          borderTopWidth="1px"
          borderColor="gray.200"
        >
          <HStack fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" flexWrap="wrap">
            <Text fontWeight="medium" minW={{ base: '50px', md: '60px' }}>
              {translations.from}:
            </Text>
            <Text overflow="hidden" textOverflow="ellipsis">
              {message.from_user?.firstname} {message.from_user?.surname}
            </Text>
          </HStack>
          <HStack
            fontSize={{ base: 'xs', md: 'sm' }}
            color="gray.600"
            flexWrap="wrap"
            align="flex-start"
          >
            <Text fontWeight="medium" minW={{ base: '50px', md: '60px' }}>
              {translations.to}:
            </Text>
            <Text overflow="hidden" textOverflow="ellipsis">
              {message.recipients
                ?.map((recipient) => `${recipient.firstname} ${recipient.surname}`)
                .join(', ')}
            </Text>
          </HStack>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500" pt={{ base: 0.5, md: 1 }}>
            {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm')}
          </Text>
        </VStack>
      </VStack>

      <Box flex="1" overflow="auto" px={{ base: 3, md: 4 }}>
        <Text whiteSpace="pre-wrap" fontSize={{ base: 'sm', md: 'md' }}>
          {message.content}
        </Text>
      </Box>
    </VStack>
  );
};

export default MessageDetail;
