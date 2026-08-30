import React from 'react';
import { useColorModeValue } from '../../shared/contexts/ColorContext';
import {
  List,
  Text,
  VStack,
  Input,
  InputGroup,
  HStack,
  Button,
  Icon,
  Separator,
} from '@chakra-ui/react';
import { FiSearch, FiChevronDown, FiChevronUp, FiMail } from 'react-icons/fi';
import { format } from 'date-fns';
import { MessageListProps } from '@frontend/types/message';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';

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
  const selectedBg = 'bg-brand-subtle';
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const unreadBg = useColorModeValue('gray.50', 'gray.800');
  const unreadFontWeight = 'bold';

  return (
    <VStack gap={0}>
      <VStack w="full" p={2}>
        <InputGroup startElement={<Icon as={FiSearch} color="text-muted" />}>
          <Input
            placeholder={t.search[language]}
            value={searchQuery}
            variant="subtle"
            onChange={(e) => onSearchChange(e.target.value)}
            size="sm"
          />
        </InputGroup>
        <HStack w="full" justifyContent="flex-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSortChange(sortDirection === 'desc' ? 'asc' : 'desc')}
          >
            {sortDirection === 'desc' ? <FiChevronDown /> : <FiChevronUp />}
            {t.sortDate[language]}
          </Button>
        </HStack>
      </VStack>
      {messages.length === 0 ? (
        <VStack p={3} gap={3}>
          <Icon as={FiMail} boxSize={12} color="text-muted" />
          <Text color="text-muted" fontWeight="medium">
            {searchQuery ? t.noMessagesFound[language] : emptyMessage}
          </Text>
        </VStack>
      ) : (
        <List.Root gap={0} w="full">
          {messages.map((message) => {
            const isUnread = message.to_user_id === currentUserId && !message.read_at;
            return (
              <React.Fragment key={message.id}>
                <List.Item
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
                  <VStack align="stretch" gap={{ base: 0.5, md: 1 }}>
                    <Text
                      fontWeight={isUnread ? unreadFontWeight : 'normal'}
                      fontSize={{ base: 'sm', md: 'md' }}
                      lineClamp={1}
                    >
                      {message.subject}
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="text-secondary" lineClamp={1}>
                      {message.from_user_id === currentUserId ? (
                        <>
                          {t.to[language]}:{' '}
                          {message.recipients
                            ?.map((recipient) => `${recipient.firstname} ${recipient.surname}`)
                            .join(', ')}
                        </>
                      ) : (
                        <>
                          {t.from[language]}: {message.from_user?.firstname}{' '}
                          {message.from_user?.surname}
                        </>
                      )}
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="text-muted">
                      {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm')}
                    </Text>
                  </VStack>
                </List.Item>
                <Separator />
              </React.Fragment>
            );
          })}
        </List.Root>
      )}
    </VStack>
  );
};

export default MessageList;
