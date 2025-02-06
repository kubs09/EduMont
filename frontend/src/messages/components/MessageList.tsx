import React from 'react';
import { List, ListItem, Text, VStack, Divider } from '@chakra-ui/react';
import { format } from 'date-fns';
import { Message } from '../types/message';
import { EmailIcon } from '@chakra-ui/icons';

interface MessageListProps {
  messages: Message[];
  selectedMessageId?: number;
  currentUserId: number;
  onMessageClick: (id: number) => void;
  emptyMessage: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedMessageId,
  currentUserId,
  onMessageClick,
  emptyMessage,
}) => {
  if (messages.length === 0) {
    return (
      <VStack p={3} spacing={3}>
        <EmailIcon boxSize={12} color="gray.400" />
        <Text color="gray.500" fontWeight="medium">
          {emptyMessage}
        </Text>
      </VStack>
    );
  }

  return (
    <List spacing={0}>
      {messages.map((message) => (
        <React.Fragment key={message.id}>
          <ListItem
            p={3}
            cursor="pointer"
            bg={selectedMessageId === message.id ? 'gray.100' : 'transparent'}
            _hover={{ bg: 'gray.50' }}
            onClick={() => onMessageClick(message.id)}
          >
            <VStack align="stretch" spacing={1}>
              <Text fontWeight="bold">{message.subject}</Text>
              <Text fontSize="sm" color="gray.600">
                {message.from_user_id === currentUserId ? (
                  <>
                    To:{' '}
                    {message.recipients
                      ?.map((recipient) => `${recipient.firstname} ${recipient.surname}`)
                      .join(', ')}
                  </>
                ) : (
                  <>
                    From: {message.from_user?.firstname} {message.from_user?.surname}
                  </>
                )}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm')}
              </Text>
            </VStack>
          </ListItem>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );
};

export default MessageList;
