import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import api from '../../services/api';

interface Teacher {
  id: number;
  firstname: string;
  surname: string;
}

interface Child {
  id: number;
  firstname: string;
  surname: string;
}

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: Teacher[];
  children: Child[];
}

const ClassesPage = () => {
  const { language } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const toast = useToast();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/api/classes');
        setClasses(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load classes',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchClasses();
  }, [toast]);

  return (
    <Box p={4}>
      <Heading mb={6}>{texts.classes.title[language]}</Heading>
      {classes.length === 0 ? (
        <Text>{texts.classes.noClasses[language]}</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{texts.classes.name[language]}</Th>
              <Th>{texts.classes.description[language]}</Th>
              <Th>{texts.classes.teachers[language]}</Th>
              <Th>{texts.classes.children[language]}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {classes.map((cls) => (
              <Tr key={cls.id}>
                <Td>{cls.name}</Td>
                <Td>{cls.description}</Td>
                <Td>
                  <VStack align="start">
                    {cls.teachers.map((teacher) => (
                      <Text key={teacher.id}>
                        {teacher.firstname} {teacher.surname}
                      </Text>
                    ))}
                  </VStack>
                </Td>
                <Td>
                  <VStack align="start">
                    {cls.children.map((child) => (
                      <Text key={child.id}>
                        {child.firstname} {child.surname}
                      </Text>
                    ))}
                  </VStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default ClassesPage;
