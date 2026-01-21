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
import { SearchBar } from '@frontend/shared/components/SearchBar';

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
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.firstname.toLowerCase().includes(query) ||
        user.surname.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

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

  const handleDeleteUser = async (userId: number) => {
    try {
      await api.delete(`/api/users/${userId}`);
      toast({
        title: texts.userTable.deleteSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchUsers();
    } catch (error: unknown) {
      const errorMsg = (error as { response?: { data?: { error?: string } } }).response?.data
        ?.error;
      let description = texts.userTable.deleteError[language];

      if (errorMsg === 'You cannot delete your own account') {
        description = texts.userTable.cannotDeleteSelf[language];
      } else if (errorMsg) {
        description = errorMsg;
      }

      toast({
        title: texts.userDashboard.errorTitle[language],
        description,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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
          <SearchBar
            placeholder={texts.userDashboard.searchPlaceholder[language]}
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <UserTable
            data={filteredUsers}
            loading={loading}
            error={error}
            onDelete={handleDeleteUser}
          />
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
