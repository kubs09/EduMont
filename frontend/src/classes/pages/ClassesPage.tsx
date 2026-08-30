import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Flex, Heading, Table, Text, VStack, Icon } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@frontend/shared/components';
import { Class } from '@frontend/types/class';
import CreateClassModal from '../components/CreateClassModal';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

const ClassesPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const toast = useAppToast();
  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    const userRole = userJson ? JSON.parse(userJson).role : localStorage.getItem('userRole') || '';
    setIsAdmin(userRole === 'admin');
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const classesResponse = await api.get<Class[]>('/api/classes');
      setClasses(classesResponse.data);
      setCurrentPage(1);
    } catch {
      toast({
        title: texts.classes.errors.fetchClassesFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast, language]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

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
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        gap={4}
        mb={6}
      >
        <Heading>{texts.classes.title[language]}</Heading>
        {isAdmin && (
          <Button variant="brand" onClick={() => setIsCreateModalOpen(true)}>
            {texts.classes.addClass[language]}
          </Button>
        )}
      </Flex>
      {classes.length === 0 ? (
        <Text>{texts.classes.noClasses[language]}</Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root variant="simple" size={{ base: 'sm', md: 'md' }}>
            <Table.Header display={{ base: 'none', md: 'table-header-group' }}>
              <Table.Row>
                <Table.ColumnHeader>{texts.classes.name[language]}</Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>
                  {texts.classes.description[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', lg: 'table-cell' }}>
                  {texts.classes.teachers[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', xl: 'table-cell' }}>
                  {texts.classes.students[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader width="4"></Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginatedClasses.map((cls, index) => {
                const primaryTeacher = getPrimaryTeacher(cls);
                const assistantTeacher = getAssistantTeacher(cls);

                return (
                  <Table.Row
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
                      base: ((currentPage - 1) * PAGE_SIZE + index) % 2 === 0 ? 'gray.50' : 'white',
                      md: 'transparent',
                    }}
                    _hover={{
                      bg: { base: 'gray.100', md: 'gray.50' },
                      transform: { base: 'translateX(2px)', md: 'none' },
                    }}
                    onClick={() => handleViewDetail(cls.id)}
                  >
                    <Table.Cell fontWeight={{ base: 'semibold', md: 'normal' }}>
                      {cls.name}
                    </Table.Cell>
                    <Table.Cell display={{ base: 'none', md: 'table-cell' }}>
                      {cls.description}
                    </Table.Cell>
                    <Table.Cell display={{ base: 'none', lg: 'table-cell' }}>
                      <VStack align="start" gap={1}>
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
                    </Table.Cell>
                    <Table.Cell display={{ base: 'none', xl: 'table-cell' }}>
                      <VStack align="start" gap={1}>
                        {getAcceptedChildren(cls).map((child) => (
                          <Text key={child.id} fontSize={{ base: 'sm', md: 'md' }}>
                            {child.firstname} {child.surname}
                          </Text>
                        ))}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <Icon as={FiChevronRight} boxSize={6} color="text-muted" />
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            totalCount={classes.length}
          />
        </Box>
      )}
      {isAdmin && (
        <CreateClassModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={fetchClasses}
        />
      )}
    </Box>
  );
};

export default ClassesPage;
