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
import api from '@frontend/services/apiConfig';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';

interface Teacher {
  id: number;
  firstname: string;
  surname: string;
  role: string;
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
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [toast]);

  const handleViewDetail = (classId: number) => {
    navigate(`/classes/${classId}`);
  };

  return (
    <Box p={4}>
      <Heading mb={6}>{texts.classes.title[language]}</Heading>
      {classes.length === 0 ? (
        <Text>{texts.classes.noClasses[language]}</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
            <Thead display={{ base: 'none', md: 'table-header-group' }}>
              <Tr>
                <Th>{texts.classes.name[language]}</Th>
                <Th display={{ base: 'none', md: 'table-cell' }}>
                  {texts.classes.description[language]}
                </Th>
                <Th display={{ base: 'none', lg: 'table-cell' }}>
                  {texts.classes.teachers[language]}
                </Th>
                <Th display={{ base: 'none', xl: 'table-cell' }}>
                  {texts.classes.children[language]}
                </Th>
                <Th width="4"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {classes.map((cls, index) => (
                <Tr
                  key={cls.id}
                  cursor="pointer"
                  transition="all 0.2s"
                  borderLeftWidth={{ base: '4px', md: '0' }}
                  borderLeftColor={{
                    base:
                      index % 3 === 0 ? 'blue.400' : index % 3 === 1 ? 'purple.400' : 'teal.400',
                    md: 'transparent',
                  }}
                  bg={{
                    base: index % 2 === 0 ? 'gray.50' : 'white',
                    md: 'transparent',
                  }}
                  _hover={{
                    bg: { base: 'gray.100', md: 'gray.50' },
                    transform: { base: 'translateX(2px)', md: 'none' },
                  }}
                  onClick={() => handleViewDetail(cls.id)}
                >
                  <Td fontWeight={{ base: 'semibold', md: 'normal' }}>{cls.name}</Td>
                  <Td display={{ base: 'none', md: 'table-cell' }}>{cls.description}</Td>
                  <Td display={{ base: 'none', lg: 'table-cell' }}>
                    <VStack align="start" spacing={1}>
                      {cls.teachers.map((teacher) => (
                        <Text key={teacher.id} fontSize={{ base: 'sm', md: 'md' }}>
                          {teacher.firstname} {teacher.surname}
                        </Text>
                      ))}
                    </VStack>
                  </Td>
                  <Td display={{ base: 'none', xl: 'table-cell' }}>
                    <VStack align="start" spacing={1}>
                      {cls.children.map((child) => (
                        <Text key={child.id} fontSize={{ base: 'sm', md: 'md' }}>
                          {child.firstname} {child.surname}
                        </Text>
                      ))}
                    </VStack>
                  </Td>
                  <Td>
                    <ChevronRightIcon boxSize={6} color="gray.500" />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default ClassesPage;
