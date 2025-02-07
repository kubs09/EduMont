import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Textarea,
  HStack,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import api from '../../services/api';
import { ROUTES } from '../../shared/route';
import { EditClassInfoModal } from '../components/EditClassInfoModal';
import { ManageClassTeachersModal } from '../components/ManageClassMembersModal';

import { Teacher } from 'types/teacher';

interface Class {
  id: number;
  name: string;
  description: string;
  min_age: number;
  max_age: number;
  teachers: Teacher[];
  children: Array<{
    id: number;
    firstname: string;
    surname: string;
    age: number;
    parent: string;
    contact: string;
    parent_id: number;
  }>;
}

interface ClassHistory {
  id: number;
  date: string;
  notes: string;
  created_at: string;
  created_by: {
    id: number;
    firstname: string;
    surname: string;
  };
}

interface User {
  id: number;
  firstname: string;
  surname: string;
  role: string;
}

const ClassDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [classData, setClassData] = useState<Class | null>(null);
  const [history, setHistory] = useState<ClassHistory[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newHistoryDate, setNewHistoryDate] = useState('');
  const [newHistoryNotes, setNewHistoryNotes] = useState('');
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userJson = localStorage.getItem('user');
        const userInfo = userJson ? JSON.parse(userJson) : null;
        const isUserAdmin = userInfo?.role === 'admin';
        const isUserTeacher = userInfo?.role === 'teacher';
        const isUserParent = userInfo?.role === 'parent';
        setIsAdmin(isUserAdmin);
        setIsTeacher(isUserTeacher);
        setIsParent(isUserParent);
        setCurrentUserId(userInfo?.id || null);

        const fetchClassData = async () => {
          try {
            const response = await api.get(`/api/classes/${id}`);
            setClassData(response.data);
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Failed to load class data',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        };

        const fetchHistory = async () => {
          try {
            const response = await api.get(`/api/classes/${id}/history`);
            setHistory(response.data);
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Failed to load class history',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        };

        fetchClassData();
        if (id) {
          fetchHistory();
        }

        if (isUserAdmin) {
          const teachersResponse = await api.get('/api/users?role=teacher');
          setAvailableTeachers(teachersResponse.data);
        }
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
  }, [id, toast]);

  const handleAddHistory = async () => {
    try {
      await api.post(`/api/classes/${id}/history`, {
        date: newHistoryDate,
        notes: newHistoryNotes,
      });
      const response = await api.get(`/api/classes/${id}/history`);
      setHistory(response.data);
      onClose();
      setNewHistoryDate('');
      setNewHistoryNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add history entry',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    try {
      await api.delete(`/api/classes/${id}/history/${historyId}`);
      setHistory(history.filter((h) => h.id !== historyId));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete history entry',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSaveClassInfo = async (updatedInfo: {
    name: string;
    description: string;
    min_age: number;
    max_age: number;
    teacherIds?: number[];
  }) => {
    if (!classData || !id) return;

    try {
      // Don't mix class teachers from state, use the ones from the update
      await api.put(`/api/classes/${id}`, updatedInfo);

      // Fetch updated data
      const updatedClass = await api.get(`/api/classes/${id}`);
      setClassData(updatedClass.data);

      toast({
        title: texts.classes.updateSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: texts.classes.updateError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getVisibleChildren = () => {
    if (!classData) return [];
    if (isAdmin || isTeacher) return classData.children;
    if (isParent) {
      // For parents, only show their own children
      return classData.children.filter((child) => child.parent_id === currentUserId);
    }
    return [];
  };

  if (!classData) {
    return null;
  }

  return (
    <Box p={4}>
      <Button leftIcon={<ChevronLeftIcon />} mb={4} onClick={() => navigate(ROUTES.CLASSES)}>
        {texts.classes.detail.backToList[language]}
      </Button>

      <Grid templateColumns="repeat(12, 1fr)" gap={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <Card>
            <CardHeader>
              <Heading size="md">{texts.classes.detail.info[language]}</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">{texts.classes.name[language]}</Text>
                  <Text>{classData.name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">{texts.classes.description[language]}</Text>
                  <Text>{classData.description}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">{texts.classes.ageRange[language]}</Text>
                  <Text>{`${classData.min_age} - ${classData.max_age}`}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">{texts.classes.detail.teachers[language]}</Text>
                  {classData.teachers.map((teacher) => (
                    <Text key={teacher.id}>
                      {teacher.firstname} {teacher.surname}
                    </Text>
                  ))}
                </Box>
              </VStack>
              {isAdmin && (
                <HStack mt={4} spacing={4}>
                  <Button colorScheme="blue" onClick={() => setIsEditInfoModalOpen(true)}>
                    {texts.classes.editInfo[language]}
                  </Button>
                  <Button colorScheme="blue" onClick={() => setIsMembersModalOpen(true)}>
                    {texts.classes.teachers[language]}
                  </Button>
                </HStack>
              )}
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 8 }}>
          <Card>
            <CardHeader>
              <Heading size="md">
                {isParent
                  ? texts.classes.detail.myChildren[language]
                  : texts.classes.detail.students[language]}
              </Heading>
            </CardHeader>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>{texts.childrenTable.firstname[language]}</Th>
                    <Th>{texts.childrenTable.surname[language]}</Th>
                    <Th>{texts.childrenTable.age[language]}</Th>
                    {(isAdmin || isTeacher) && <Th>{texts.childrenTable.parent[language]}</Th>}
                    {(isAdmin || isTeacher) && <Th>{texts.childrenTable.contact[language]}</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {getVisibleChildren().map((child) => (
                    <Tr key={child.id}>
                      <Td>{child.firstname}</Td>
                      <Td>{child.surname}</Td>
                      <Td>{child.age}</Td>
                      {(isAdmin || isTeacher) && <Td>{child.parent}</Td>}
                      {(isAdmin || isTeacher) && <Td>{child.contact}</Td>}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <Card mt={6}>
        <CardHeader>
          <Heading size="md">{texts.classes.detail.history[language]}</Heading>
        </CardHeader>
        <CardBody>
          {(isAdmin || isTeacher) && (
            <Button mb={4} colorScheme="blue" onClick={onOpen}>
              {texts.classes.detail.addHistory[language]}
            </Button>
          )}
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>{texts.classes.detail.date[language]}</Th>
                <Th>{texts.classes.detail.notes[language]}</Th>
                <Th>{texts.classes.detail.createdBy[language]}</Th>
                {(isAdmin || isTeacher) && <Th>{texts.common.actions[language]}</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {history.map((entry) => (
                <Tr key={entry.id}>
                  <Td>{new Date(entry.date).toLocaleDateString()}</Td>
                  <Td>{entry.notes}</Td>
                  <Td>{`${entry.created_by.firstname} ${entry.created_by.surname}`}</Td>
                  {(isAdmin || isTeacher) && (
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteHistory(entry.id)}
                      >
                        {texts.common.delete[language]}
                      </Button>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {(isAdmin || isTeacher) && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{texts.classes.detail.addHistory[language]}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Input
                  type="date"
                  value={newHistoryDate}
                  onChange={(e) => setNewHistoryDate(e.target.value)}
                />
                <Textarea
                  value={newHistoryNotes}
                  onChange={(e) => setNewHistoryNotes(e.target.value)}
                  placeholder={texts.classes.detail.notesPlaceholder[language]}
                />
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleAddHistory}>
                {texts.common.save[language]}
              </Button>
              <Button onClick={onClose}>{texts.common.cancel[language]}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {isAdmin && classData && (
        <>
          <EditClassInfoModal
            isOpen={isEditInfoModalOpen}
            onClose={() => setIsEditInfoModalOpen(false)}
            classData={classData}
            onSave={handleSaveClassInfo}
          />
          <ManageClassTeachersModal
            isOpen={isMembersModalOpen}
            onClose={() => setIsMembersModalOpen(false)}
            classData={classData}
            availableTeachers={availableTeachers}
            onSave={(teacherIds) =>
              handleSaveClassInfo({
                name: classData.name,
                description: classData.description,
                min_age: classData.min_age,
                max_age: classData.max_age,
                teacherIds,
              })
            }
          />
        </>
      )}
    </Box>
  );
};

export default ClassDetailPage;
