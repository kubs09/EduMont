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
  Badge,
  TableContainer,
  Stack,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { confirmClassChild, getClassNextActivities, NextActivity } from '../../services/api/class';
import { ROUTES } from '../../shared/route';
import { EditClassInfoModal } from '../components/EditClassInfoModal';
import { ManageClassTeachersModal } from '../components/ManageClassTeachersModal';

import { Class } from '../../types/class';

const calculateEndTime = (startTime: string, durationHours: number | string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);

  let duration: number;
  if (typeof durationHours === 'string') {
    const match = durationHours.match(/^(\d+(?:\.\d+)?)/);
    duration = match ? parseFloat(match[1]) : 0;
  } else {
    duration = durationHours;
  }

  if (isNaN(duration) || duration < 0) {
    return formatTime(startTime);
  }

  const endHours = hours + duration;
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

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

const transformClassData = (data: Class): Class => ({
  ...data,
  children: data.children.map((child) => ({
    ...child,
    parent: `${child.parent_firstname} ${child.parent_surname}`.trim(),
  })),
});

const ClassDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [classData, setClassData] = useState<Class | null>(null);
  const [history, setHistory] = useState<ClassHistory[]>([]);
  const [nextActivities, setNextActivities] = useState<NextActivity[]>([]);
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
            setClassData(transformClassData(response.data));
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

        const fetchNextActivities = async () => {
          try {
            if (!id) return;
            const activities = await getClassNextActivities(parseInt(id));
            setNextActivities(activities);
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Failed to load next activities',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        };

        fetchClassData();
        if (id) {
          fetchHistory();
          fetchNextActivities();
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
      await api.put(`/api/classes/${id}`, updatedInfo);

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

  const handleConfirmChild = async (childId: number) => {
    if (!id) return;

    try {
      const response = await confirmClassChild(parseInt(id), childId);
      setClassData(transformClassData(response));

      toast({
        title: texts.classes.confirmation.success[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: texts.classes.confirmation.error[language],
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDenyChild = async (childId: number) => {
    if (!id) return;

    try {
      const response = await api.put(`/api/classes/${id}/children/${childId}/deny`);
      setClassData(transformClassData(response.data));

      toast({
        title: texts.classes.confirmation.success[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: texts.classes.confirmation.error[language],
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getVisibleChildren = () => {
    if (!classData) return [];
    if (isAdmin || isTeacher) return classData.children;
    if (isParent) {
      return classData.children.filter((child) => child.parent_id === currentUserId);
    }
    return [];
  };

  if (!classData) {
    return null;
  }

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Button
        leftIcon={<ChevronLeftIcon />}
        mb={4}
        onClick={() => navigate(ROUTES.CLASSES)}
        size="md"
      >
        {texts.classes.detail.backToList[language]}
      </Button>

      <Grid templateColumns="repeat(12, 1fr)" gap={{ base: 4, md: 6 }}>
        <GridItem colSpan={{ base: 12, lg: 4 }}>
          <Card>
            <CardHeader>
              <Heading size={{ base: 'sm', md: 'md' }}>
                {texts.classes.detail.info[language]}
              </Heading>
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
                <Stack mt={4} direction={{ base: 'column', sm: 'row' }} spacing={4} w="full">
                  <Button
                    colorScheme="blue"
                    onClick={() => setIsEditInfoModalOpen(true)}
                    size="md"
                    w={{ base: 'full', sm: 'auto' }}
                  >
                    {texts.classes.editInfo[language]}
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => setIsMembersModalOpen(true)}
                    size="md"
                    w={{ base: 'full', sm: 'auto' }}
                  >
                    {texts.classes.teachers[language]}
                  </Button>
                </Stack>
              )}
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={{ base: 12, lg: 8 }}>
          <Card>
            <CardHeader>
              <Heading size={{ base: 'sm', md: 'md' }}>
                {isParent
                  ? texts.classes.detail.myChildren[language]
                  : texts.classes.detail.students[language]}
              </Heading>
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr>
                      <Th>{texts.childrenTable.firstname[language]}</Th>
                      <Th>{texts.childrenTable.surname[language]}</Th>
                      <Th>{texts.childrenTable.age[language]}</Th>
                      {(isAdmin || isTeacher) && <Th>{texts.childrenTable.parent[language]}</Th>}
                      {(isAdmin || isTeacher) && <Th>{texts.childrenTable.contact[language]}</Th>}
                      {(isAdmin || isTeacher) && <Th>{texts.common.actions[language]}</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {getVisibleChildren().map((child) => (
                      <Tr key={child.id}>
                        <Td>{child.firstname}</Td>
                        <Td>{child.surname}</Td>
                        <Td>{child.age}</Td>
                        {(isAdmin || isTeacher) && <Td>{child.parent}</Td>}
                        {(isAdmin || isTeacher) && (
                          <Td>{child.parent_contact || child.parent_email}</Td>
                        )}
                        {(isAdmin || isTeacher) && (
                          <Td>
                            {child.status === 'accepted' ? (
                              <Badge colorScheme="green">
                                {texts.classes.confirmation.accepted[language]}
                              </Badge>
                            ) : child.status === 'denied' ? (
                              <Badge colorScheme="red">
                                {texts.classes.confirmation.denied[language]}
                              </Badge>
                            ) : (
                              <HStack spacing={2}>
                                <Badge colorScheme="yellow">
                                  {texts.classes.confirmation.pending[language]}
                                </Badge>
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleConfirmChild(child.id)}
                                >
                                  {texts.classes.confirmation.accept[language]}
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDenyChild(child.id)}
                                >
                                  {texts.classes.confirmation.deny[language]}
                                </Button>
                              </HStack>
                            )}
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Next Activities Section */}
      <Card my={6}>
        <CardHeader>
          <Heading size={{ base: 'sm', md: 'md' }}>
            {texts.classes.detail.nextActivities[language]}
          </Heading>
        </CardHeader>
        <CardBody>
          {nextActivities.length === 0 ? (
            <Text color="gray.500" fontStyle="italic">
              {texts.classes.detail.noNextActivities[language]}
            </Text>
          ) : (
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th>{texts.childrenTable.firstname[language]}</Th>
                    <Th>{texts.childrenTable.surname[language]}</Th>
                    <Th>{texts.classes.detail.date[language]}</Th>
                    <Th>{texts.classes.detail.time[language]}</Th>
                    <Th>{texts.classes.detail.activity[language]}</Th>
                    {(isAdmin || isTeacher) && <Th>{texts.classes.detail.notes[language]}</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {nextActivities.map((activity) => (
                    <Tr key={`${activity.child_id}-${activity.date}-${activity.start_time}`}>
                      <Td>{activity.firstname}</Td>
                      <Td>{activity.surname}</Td>
                      <Td>{new Date(activity.date).toLocaleDateString()}</Td>
                      <Td>{`${formatTime(activity.start_time)} - ${calculateEndTime(activity.start_time, activity.duration_hours)}`}</Td>
                      <Td>{activity.activity || '-'}</Td>
                      {(isAdmin || isTeacher) && <Td>{activity.notes || '-'}</Td>}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      <Card my={12}>
        <CardHeader>
          <Heading size={{ base: 'sm', md: 'md' }}>
            {texts.classes.detail.history[language]}
          </Heading>
        </CardHeader>
        <CardBody>
          {(isAdmin || isTeacher) && (
            <Button mb={4} colorScheme="blue" onClick={onOpen} size="md">
              {texts.classes.detail.addHistory[language]}
            </Button>
          )}
          <TableContainer>
            <Table variant="simple" size="md">
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
          </TableContainer>
        </CardBody>
      </Card>

      {(isAdmin || isTeacher) && (
        <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }}>
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
            size={{ base: 'full', md: 'lg' }}
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
            size={{ base: 'full', md: 'lg' }}
          />
        </>
      )}
    </Box>
  );
};

export default ClassDetailPage;
