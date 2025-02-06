import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Text,
  List,
  ListItem,
  IconButton,
  Divider,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, EmailIcon, RepeatIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';
import {
  getMessage,
  getMessages,
  sendMessage,
  deleteMessage,
  getMessageUsers,
} from '../services/api';
import { useSnackbar } from 'notistack';

interface Message {
  id: number;
  subject: string;
  content: string;
  from_user_id: number;
  to_user_id: number;
  created_at: string;
  read_at: string | null;
  from_user?: {
    firstname: string;
    surname: string;
    email: string;
  };
  to_user?: {
    firstname: string;
    surname: string;
    email: string;
  };
}

const Messages: React.FC = () => {
  const { language } = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const t = texts.messages;

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    to_user_id: '',
    subject: '',
    content: '',
  });
  const [users, setUsers] = useState<Array<{ id: number; firstname: string; surname: string }>>([]);

  const fetchMessages = React.useCallback(async () => {
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch messages', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchUsers = React.useCallback(async () => {
    try {
      const data = await getMessageUsers();
      if (!data || data.length === 0) {
        console.log('No users returned from API');
      }
      setUsers(data);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      enqueueSnackbar(texts.messages.fetchUsersError[language] || 'Failed to fetch users', {
        variant: 'error',
        autoHideDuration: 5000,
      });
    }
  }, [enqueueSnackbar, language]);

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [fetchMessages, fetchUsers]);

  const handleMessageClick = async (id: number) => {
    try {
      const message = await getMessage(id);
      setSelectedMessage(message);
    } catch (error) {
      enqueueSnackbar('Failed to fetch message details', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMessage(id);
      fetchMessages();
      setSelectedMessage(null);
      enqueueSnackbar('Message deleted', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete message', { variant: 'error' });
    }
  };

  const handleSend = async () => {
    try {
      await sendMessage({
        to_user_id: parseInt(newMessage.to_user_id),
        subject: newMessage.subject,
        content: newMessage.content,
      });
      setComposeOpen(false);
      setNewMessage({ to_user_id: '', subject: '', content: '' });
      fetchMessages();
      enqueueSnackbar('Message sent', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to send message', { variant: 'error' });
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box p={3}>
      <Grid templateColumns="repeat(12, 1fr)" gap={4}>
        <GridItem colSpan={12}>
          <Button
            leftIcon={<EmailIcon />}
            colorScheme="blue"
            onClick={() => setComposeOpen(true)}
            mb={2}
          >
            {t.compose[language]}
          </Button>
        </GridItem>

        <GridItem colSpan={4}>
          <Box
            bg={bgColor}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
            h="calc(100vh - 200px)"
            overflow="auto"
          >
            {messages.length > 0 ? (
              <List spacing={0}>
                {messages.map((message) => (
                  <React.Fragment key={message.id}>
                    <ListItem
                      p={3}
                      cursor="pointer"
                      bg={selectedMessage?.id === message.id ? 'gray.100' : 'transparent'}
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleMessageClick(message.id)}
                    >
                      <VStack align="stretch" spacing={1}>
                        <Text fontWeight="bold">{message.subject}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {message.from_user?.firstname} {message.from_user?.surname}
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
            ) : (
              <VStack p={3} spacing={3}>
                <EmailIcon boxSize={12} color="gray.400" />
                <Text color="gray.500" fontWeight="medium">
                  {t.noMessages[language]}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  {t.compose[language]}
                </Text>
              </VStack>
            )}
          </Box>
        </GridItem>

        <GridItem colSpan={8}>
          <Box
            bg={bgColor}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
            h="calc(100vh - 200px)"
            p={4}
          >
            {selectedMessage ? (
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Text fontSize="2xl">{selectedMessage.subject}</Text>
                  <HStack>
                    <IconButton
                      icon={<RepeatIcon />}
                      aria-label="Reply"
                      onClick={() => setComposeOpen(true)}
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      aria-label="Delete"
                      onClick={() => handleDelete(selectedMessage.id)}
                    />
                  </HStack>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  {t.from[language]}: {selectedMessage.from_user?.firstname}{' '}
                  {selectedMessage.from_user?.surname}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {format(new Date(selectedMessage.created_at), 'dd.MM.yyyy HH:mm')}
                </Text>
                <Text>{selectedMessage.content}</Text>
              </VStack>
            ) : (
              <VStack h="100%" justify="center" spacing={4}>
                <EmailIcon boxSize={16} color="gray.400" />
                <Text fontSize="xl" color="gray.500">
                  {t.title[language]}
                </Text>
                <Button
                  leftIcon={<EmailIcon />}
                  colorScheme="blue"
                  onClick={() => setComposeOpen(true)}
                >
                  {t.compose[language]}
                </Button>
              </VStack>
            )}
          </Box>
        </GridItem>
      </Grid>

      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t.compose[language]}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t.to[language]}</FormLabel>
                <Select
                  value={newMessage.to_user_id}
                  onChange={(e) => setNewMessage({ ...newMessage, to_user_id: e.target.value })}
                  placeholder={
                    users.length === 0 ? t.noUsersAvailable[language] : t.selectUser[language]
                  }
                  isDisabled={users.length === 0}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstname} {user.surname}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>{t.subject[language]}</FormLabel>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t.content[language]}</FormLabel>
                <Textarea
                  rows={4}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={() => setComposeOpen(false)}>
              {texts.classes.cancel[language]}
            </Button>
            <Button colorScheme="blue" onClick={handleSend}>
              {t.send[language]}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Messages;
