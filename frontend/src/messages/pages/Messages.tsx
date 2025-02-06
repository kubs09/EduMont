import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Button,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { EmailIcon, RepeatIcon } from '@chakra-ui/icons';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import {
  getMessage,
  getMessages,
  sendMessage,
  deleteMessage,
  getMessageUsers,
} from '../../services/api';
import { useSnackbar } from 'notistack';
import ComposeMessageModal from '../components/ComposeMessageModal';
import MessageList from '../components/MessageList';
import MessageDetail from '../components/MessageDetail';
import { Message } from '../types/message';

const Messages: React.FC = () => {
  const { language } = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const t = texts.messages;

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: number; firstname: string; surname: string }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMessages = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch messages', { variant: 'error' });
    } finally {
      setIsRefreshing(false);
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

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const receivedMessages = messages.filter((msg) => msg.to_user_id === currentUser.id);
  const sentMessages = messages.filter((msg) => msg.from_user_id === currentUser.id);

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
            mr={2}
          >
            {t.compose[language]}
          </Button>
          <Button leftIcon={<RepeatIcon />} onClick={fetchMessages} isLoading={isRefreshing} mb={2}>
            {t.refresh?.[language] || 'Refresh'}
          </Button>
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 5, lg: 4 }}>
          <Box
            bg={bgColor}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
            h={{ base: 'calc(50vh - 100px)', md: 'calc(100vh - 250px)' }}
            overflow="hidden"
          >
            <Tabs isFitted variant="enclosed">
              <TabList>
                <Tab>{t.inbox[language]}</Tab>
                <Tab>{t.sent[language]}</Tab>
              </TabList>
              <TabPanels
                overflow="auto"
                maxH={{ base: 'calc(50vh - 170px)', md: 'calc(100vh - 320px)' }}
              >
                <TabPanel p={0}>
                  <MessageList
                    messages={receivedMessages}
                    selectedMessageId={selectedMessage?.id}
                    currentUserId={currentUser.id}
                    onMessageClick={handleMessageClick}
                    emptyMessage={t.noMessages[language]}
                  />
                </TabPanel>
                <TabPanel p={0}>
                  <MessageList
                    messages={sentMessages}
                    selectedMessageId={selectedMessage?.id}
                    currentUserId={currentUser.id}
                    onMessageClick={handleMessageClick}
                    emptyMessage={t.noMessages[language]}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 7, lg: 8 }}>
          <Box
            bg={bgColor}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
            h={{ base: 'calc(50vh - 100px)', md: 'calc(100vh - 250px)' }}
            p={4}
          >
            <MessageDetail
              message={selectedMessage}
              onDelete={handleDelete}
              onCompose={() => setComposeOpen(true)}
              translations={{
                from: t.from[language],
                to: t.to[language],
                title: t.title[language],
                compose: t.compose[language],
              }}
            />
          </Box>
        </GridItem>
      </Grid>

      <ComposeMessageModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={async (data) => {
          try {
            await sendMessage(data);
            fetchMessages();
            enqueueSnackbar('Message sent', { variant: 'success' });
          } catch (error) {
            enqueueSnackbar('Failed to send message', { variant: 'error' });
          }
        }}
        users={users}
      />
    </Box>
  );
};

export default Messages;
