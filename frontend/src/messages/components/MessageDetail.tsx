import React from 'react';
import { VStack, HStack, Text, IconButton, Button, Box, Icon } from '@chakra-ui/react';
import { FiTrash2, FiMail } from 'react-icons/fi';
import { format } from 'date-fns';
import { MessageDetailProps } from '@frontend/types/message';

const MessageDetail: React.FC<MessageDetailProps> = ({
  message,
  onDelete,
  onCompose,
  translations,
}) => {
  if (!message) {
    return (
      <VStack h="100%" justify="center" gap={{ base: 3, md: 4 }}>
        <Icon as={FiMail} boxSize={{ base: 12, md: 16 }} color="text-muted" />
        <Text fontSize={{ base: 'lg', md: 'xl' }} color="text-muted" textAlign="center">
          {translations.title}
        </Text>
        <Button size={{ base: 'sm', md: 'md' }} onClick={onCompose}>
          <FiMail />
          {translations.compose}
        </Button>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={{ base: 4, md: 6 }} h="100%">
      <VStack
        align="stretch"
        gap={{ base: 2, md: 3 }}
        p={{ base: 3, md: 4 }}
        borderRadius="md"
        borderWidth="1px"
        borderColor="border-color"
      >
        <HStack justify="space-between" gap={{ base: 2, sm: 3 }} align="center">
          <Text
            fontSize={{ base: 'md', sm: 'lg', md: '2xl' }}
            fontWeight="semibold"
            lineClamp={{ base: 2, md: 1 }}
            flex="1"
          >
            {message.subject}
          </Text>
          <IconButton
            flexShrink={0}
            size={{ base: 'sm', md: 'md' }}
            aria-label={translations.delete}
            onClick={() => onDelete(message.id)}
            colorPalette="red"
            variant="ghost"
          >
            <FiTrash2 />
          </IconButton>
        </HStack>

        <VStack
          align="stretch"
          gap={{ base: 0.5, md: 1 }}
          pt={{ base: 1, md: 2 }}
          borderTopWidth="1px"
          borderColor="border-color"
        >
          <HStack fontSize={{ base: 'xs', md: 'sm' }} color="text-secondary" flexWrap="wrap">
            <Text fontWeight="medium" minW={{ base: '50px', md: '60px' }}>
              {translations.from}:
            </Text>
            <Text overflow="hidden" textOverflow="ellipsis">
              {message.from_user?.firstname} {message.from_user?.surname}
            </Text>
          </HStack>
          <HStack
            fontSize={{ base: 'xs', md: 'sm' }}
            color="text-secondary"
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
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="text-muted" pt={{ base: 0.5, md: 1 }}>
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
