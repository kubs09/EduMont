import React from 'react';
import {
  List,
  ListItem,
  Text,
  VStack,
  Divider,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Button,
} from '@chakra-ui/react';
import { Search2Icon, TriangleDownIcon, TriangleUpIcon, EmailIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';
import { Message } from '@frontend/types/message';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';

interface MessageListProps {
  messages: Message[];
  selectedMessageId?: number;
  currentUserId: number;
  onMessageClick: (id: number) => void;
  emptyMessage: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortChange: (direction: 'asc' | 'desc') => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedMessageId,
  currentUserId,
  onMessageClick,
  emptyMessage,
  searchQuery,
  onSearchChange,
  sortDirection,
  onSortChange,
}) => {
  const { language } = useLanguage();
  const t = texts.messages;
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const unreadBg = useColorModeValue('gray.50', 'gray.800');
  const unreadFontWeight = 'bold';

  return (
    <VStack spacing={0}>
      <VStack w="full" p={2}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Search2Icon color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder={t.search[language]}
            value={searchQuery}
            variant="filled"
            onChange={(e) => onSearchChange(e.target.value)}
            size="sm"
          />
        </InputGroup>
        <HStack w="full" justifyContent="flex-end">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={sortDirection === 'desc' ? <TriangleDownIcon /> : <TriangleUpIcon />}
            onClick={() => onSortChange(sortDirection === 'desc' ? 'asc' : 'desc')}
          >
            {t.sortDate[language]}
          </Button>
        </HStack>
      </VStack>
      {messages.length === 0 ? (
        <VStack p={3} spacing={3}>
          <EmailIcon boxSize={12} color="gray.400" />
          <Text color="gray.500" fontWeight="medium">
            {searchQuery ? t.noMessagesFound[language] : emptyMessage}
          </Text>
        </VStack>
      ) : (
        <List spacing={0} w="full">
          {messages.map((message) => {
            const isUnread = message.to_user_id === currentUserId && !message.read_at;
            return (
              <React.Fragment key={message.id}>
                <ListItem
                  p={{ base: 2, md: 3 }}
                  cursor="pointer"
                  bg={
                    selectedMessageId === message.id
                      ? selectedBg
                      : isUnread
                        ? unreadBg
                        : 'transparent'
                  }
                  _hover={{ bg: selectedMessageId === message.id ? selectedBg : hoverBg }}
                  onClick={() => onMessageClick(message.id)}
                >
                  <VStack align="stretch" spacing={{ base: 0.5, md: 1 }}>
                    <Text
                      fontWeight={isUnread ? unreadFontWeight : 'normal'}
                      fontSize={{ base: 'sm', md: 'md' }}
                      noOfLines={1}
                    >
                      {message.subject}
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" noOfLines={1}>
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
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">
                      {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm')}
                    </Text>
                  </VStack>
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </VStack>
  );
};

export default MessageList;
