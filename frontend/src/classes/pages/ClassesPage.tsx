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
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@frontend/shared/components';
import { ClassTeacher } from '@frontend/types/class';

interface Child {
  id: number;
  firstname: string;
  surname: string;
}

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: ClassTeacher[];
  children: Child[];
}

const ClassesPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();
  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);
        setCurrentPage(1);
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

  const getAcceptedChildren = (cls: Class) => cls.children || [];
  const getPrimaryTeacher = (cls: Class) =>
    cls.teachers.find((teacher) => teacher.class_role === 'teacher');
  const getAssistantTeacher = (cls: Class) =>
    cls.teachers.find((teacher) => teacher.class_role === 'assistant');

  const totalPages = Math.ceil(classes.length / PAGE_SIZE);
  const paginatedClasses = classes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
              {paginatedClasses.map((cls, index) => {
                const primaryTeacher = getPrimaryTeacher(cls);
                const assistantTeacher = getAssistantTeacher(cls);

                return (
                  <Tr
                    key={cls.id}
                    cursor="pointer"
                    transition="all 0.2s"
                    borderLeftWidth={{ base: '4px', md: '0' }}
                    borderLeftColor={{
                      base:
                        ((currentPage - 1) * PAGE_SIZE + index) % 3 === 0
                          ? 'blue.400'
                          : ((currentPage - 1) * PAGE_SIZE + index) % 3 === 1
                            ? 'purple.400'
                            : 'teal.400',
                      md: 'transparent',
                    }}
                    bg={{
                      base:
                        ((currentPage - 1) * PAGE_SIZE + index) % 2 === 0
                          ? 'gray.50'
                          : 'white',
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
                        <Text fontSize={{ base: 'sm', md: 'md' }}>
                          {texts.classes.teacher[language]}:{' '}
                          {primaryTeacher
                            ? `${primaryTeacher.firstname} ${primaryTeacher.surname}`
                            : '-'}
                        </Text>
                        <Text fontSize={{ base: 'sm', md: 'md' }}>
                          {texts.classes.assistant[language]}:{' '}
                          {assistantTeacher
                            ? `${assistantTeacher.firstname} ${assistantTeacher.surname}`
                            : '-'}
                        </Text>
                      </VStack>
                    </Td>
                    <Td display={{ base: 'none', xl: 'table-cell' }}>
                      <VStack align="start" spacing={1}>
                        {getAcceptedChildren(cls).map((child) => (
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
                );
              })}
            </Tbody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            totalCount={classes.length}
          />
        </Box>
      )}
    </Box>
  );
};

export default ClassesPage;
