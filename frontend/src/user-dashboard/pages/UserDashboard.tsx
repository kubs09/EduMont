import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  useToast,
  Button,
  HStack,
} from '@chakra-ui/react';
import UserTable from '../components/UserTable';
import AddUserDialog from '../components/AddUserDialog';
import api from '@frontend/services/apiConfig';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';

interface User {
  id: number;
  email: string;
  firstname: string;
  surname: string;
  role: 'admin' | 'teacher' | 'parent';
}

const UserDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const toast = useToast();

  const fetchUsers = React.useCallback(async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
      setError(null);
    } catch (error) {
      const errorMessage = texts.userDashboard.fetchError[language];
      setError(errorMessage);
      toast({
        title: texts.userDashboard.errorTitle[language],
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [language, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <Box p={6}>
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading>{texts.userDashboard.title[language]}</Heading>
            <Button colorScheme="blue" onClick={() => setIsAddUserOpen(true)}>
              {texts.userDashboard.addUserButton[language]}
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <UserTable data={users} loading={loading} error={error} />
        </CardBody>
      </Card>
      <AddUserDialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onUserAdded={fetchUsers}
      />
    </Box>
  );
};

export default UserDashboard;
