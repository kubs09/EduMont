import React from 'react';
import { VStack, HStack, Text, IconButton, Button } from '@chakra-ui/react';
import { DeleteIcon, RepeatIcon, EmailIcon } from '@chakra-ui/icons';
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
      <VStack h="100%" justify="center" spacing={4}>
        <EmailIcon boxSize={16} color="gray.400" />
        <Text fontSize="xl" color="gray.500">
          {translations.title}
        </Text>
        <Button leftIcon={<EmailIcon />} colorScheme="blue" onClick={onCompose}>
          {translations.compose}
        </Button>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Text fontSize="2xl">{message.subject}</Text>
        <HStack>
          <IconButton icon={<RepeatIcon />} aria-label="Reply" onClick={onCompose} />
          <IconButton
            icon={<DeleteIcon />}
            aria-label="Delete"
            onClick={() => onDelete(message.id)}
          />
        </HStack>
      </HStack>
      <Text fontSize="sm" color="gray.600">
        {translations.from}: {message.from_user?.firstname} {message.from_user?.surname}
      </Text>
      <Text fontSize="sm" color="gray.600">
        {translations.to}:{' '}
        {message.recipients
          ?.map((recipient) => `${recipient.firstname} ${recipient.surname}`)
          .join(', ')}
      </Text>
      <Text fontSize="sm" color="gray.500">
        {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm')}
      </Text>
      <Text>{message.content}</Text>
    </VStack>
  );
};

export default MessageDetail;
