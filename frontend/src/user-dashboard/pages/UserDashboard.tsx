import React, { useEffect, useState } from 'react';
import { Box, Card, CardHeader, CardBody, Heading, useToast } from '@chakra-ui/react';
import UserTable from '../components/UserTable';
import api from '../../services/api';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent';
}

const UserDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users'); // Updated endpoint
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
    };

    fetchUsers();
  }, [language, toast]);

  return (
    <Box p={6}>
      <Card>
        <CardHeader>
          <Heading>{texts.userDashboard.title[language]}</Heading>
        </CardHeader>
        <CardBody>
          <UserTable data={users} loading={loading} error={error} />
        </CardBody>
      </Card>
    </Box>
  );
};

export default UserDashboard;
