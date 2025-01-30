import React, { useEffect, useState } from 'react';
import { Box, Card, CardHeader, CardBody, Heading } from '@chakra-ui/react';
import ChildrenTable from '../components/ChildrenTable';
import api from '../../services/api';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';

interface Child {
  id: number;
  name: string;
  age: number;
  parent_name: string;
  contact: string;
  notes: string;
}

const Dashboard: React.FC = () => {
  const { language } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await api.get('/api/children');
        setChildren(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching children:', error);
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  return (
    <Box p={6}>
      <Card>
        <CardHeader>
          <Heading>{texts.dashboard.title[language]}</Heading>
        </CardHeader>
        <CardBody>
          <ChildrenTable data={children} loading={loading} />
        </CardBody>
      </Card>
    </Box>
  );
};

export default Dashboard;
