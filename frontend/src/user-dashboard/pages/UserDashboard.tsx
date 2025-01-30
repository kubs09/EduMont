import React, { useEffect, useState } from 'react';
import { Box, Card, CardHeader, CardBody, Heading } from '@chakra-ui/react';
import UserTable from '../components/UserTable';
import api from '../../services/api';
import { texts } from '../../texts';
import { useLanguage } from '../../contexts/LanguageContext';

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users');
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Box p={6}>
      <Card>
        <CardHeader>
          <Heading>{texts.userDashboard.title[language]}</Heading>
        </CardHeader>
        <CardBody>
          <UserTable data={users} loading={loading} />
        </CardBody>
      </Card>
    </Box>
  );
};

export default UserDashboard;
