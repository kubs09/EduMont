import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Text,
  VStack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Badge,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import api from '../../services/apiConfig';
import { Child } from '../../types/child';
import { Schedule } from '../../types/schedule';
import { ROUTES } from '../../shared/route';
import EditChildModal from '../components/EditChildModal';
import { Tabs, TabItem } from '../../shared/components/Tabs';

interface ChildClass {
  id: number;
  name: string;
  description: string;
  status: 'accepted' | 'denied' | 'pending';
  teacher_firstname: string;
  teacher_surname: string;
}

const ChildDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [childData, setChildData] = useState<Child | null>(null);
  const [classes, setClasses] = useState<ChildClass[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { isOpen: isClassDeleteOpen, onClose: onClassDeleteClose } = useDisclosure();
  const [classToDelete] = useState<ChildClass | null>(null);
  const cancelRef = React.useRef() as React.MutableRefObject<HTMLButtonElement>;
  const userRole = localStorage.getItem('userRole');
  const currentUserId = localStorage.getItem('userId');
  const isParent = userRole === 'parent';
  const isAdmin = userRole === 'admin';

  const canEdit = isAdmin || (isParent && childData?.parent_id === parseInt(currentUserId || '0'));

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const childResponse = await api.get(`/api/children/${id}`);
        setChildData(childResponse.data);

        const classesResponse = await api.get(`/api/children/${id}/classes`);
        setClasses(classesResponse.data || []);

        try {
          const schedulesResponse = await api.get(`/api/children/${id}/schedules`);
          setSchedules(schedulesResponse.data || []);
        } catch (err) {
          setSchedules([]);
        }
      } catch (error) {
        console.error('Failed to fetch child data:', error);
        toast({
          title: texts.profile.error[language],
          description: 'Failed to load child data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [id, language, toast]);

  const handleEditSave = async (updatedData: Partial<Child>) => {
    if (!childData || !id) return;

    try {
      const response = await api.put(`/api/children/${id}`, {
        firstname: updatedData.firstname || childData.firstname,
        surname: updatedData.surname || childData.surname,
        date_of_birth: updatedData.date_of_birth || childData.date_of_birth,
        notes: updatedData.notes || childData.notes,
      });

      setChildData(response.data);
      setIsEditModalOpen(false);
      toast({
        title: texts.profile.success[language],
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to update child:', error);
      toast({
        title: texts.profile.error[language],
        description: 'Failed to update child',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteChild = async () => {
    if (!id) return;

    try {
      await api.delete(`/api/children/${id}`);
      toast({
        title: texts.profile.children.deleteSuccess[language],
        status: 'success',
        duration: 3000,
      });
      navigate(ROUTES.CHILDREN);
    } catch (error) {
      console.error('Failed to delete child:', error);
      toast({
        title: texts.profile.error[language],
        description: 'Failed to delete child',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleDeleteChildClass = async (classId: number) => {
    if (!id) return;

    try {
      await api.delete(`/api/children/${id}/classes/${classId}`);
      setClasses(classes.filter((c) => c.id !== classId));
      toast({
        title: 'Class removed successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to remove class:', error);
      toast({
        title: texts.profile.error[language],
        description: 'Failed to remove class',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    onClassDeleteClose();
  };

  const handleConfirmChildClass = async (classId: number) => {
    if (!id) return;

    try {
      await api.post(`/api/classes/${classId}/children/${id}/confirm`);
      setClasses(classes.map((c) => (c.id === classId ? { ...c, status: 'accepted' } : c)));
      toast({
        title: texts.classes.confirmation.success[language],
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to confirm class:', error);
      toast({
        title: texts.profile.error[language],
        description: 'Failed to confirm class',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDenyChildClass = async (classId: number) => {
    if (!id) return;

    try {
      await api.post(`/api/classes/${classId}/children/${id}/deny`);
      setClasses(classes.map((c) => (c.id === classId ? { ...c, status: 'denied' } : c)));
      toast({
        title: texts.classes.confirmation.success[language],
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to deny class:', error);
      toast({
        title: texts.profile.error[language],
        description: 'Failed to deny class',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'accepted':
        return 'green';
      case 'denied':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'accepted':
        return texts.classes.confirmation.accepted[language];
      case 'denied':
        return texts.classes.confirmation.denied[language];
      case 'pending':
        return texts.classes.confirmation.pending[language];
      default:
        return status;
    }
  };

  if (!childData) {
    return null;
  }

  const age = new Date().getFullYear() - new Date(childData.date_of_birth).getFullYear();

  const tabItems: TabItem[] = [
    {
      id: 'information',
      label: texts.profile.children.title[language],
      content: (
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontWeight="bold">{texts.childrenTable.firstname[language]}</Text>
            <Text>{childData.firstname}</Text>
          </Box>
          <Box>
            <Text fontWeight="bold">{texts.childrenTable.surname[language]}</Text>
            <Text>{childData.surname}</Text>
          </Box>
          <Box>
            <Text fontWeight="bold">{texts.childrenTable.age[language]}</Text>
            <Text>{age}</Text>
          </Box>
          <Box>
            <Text fontWeight="bold">{texts.profile.children.dateOfBirth[language]}</Text>
            <Text>{new Date(childData.date_of_birth).toLocaleDateString(language)}</Text>
          </Box>
          {childData.notes && (
            <Box>
              <Text fontWeight="bold">{texts.childrenTable.notes[language]}</Text>
              <Text>{childData.notes}</Text>
            </Box>
          )}
          <Box>
            <Text fontWeight="bold">{texts.childrenTable.parent[language]}</Text>
            <Text>
              {childData.parent_firstname} {childData.parent_surname}
            </Text>
          </Box>
          {childData.parent_email && (
            <Box>
              <Text fontWeight="bold">{texts.profile.email[language]}</Text>
              <Text>{childData.parent_email}</Text>
            </Box>
          )}
          {canEdit && (
            <HStack mt={6} spacing={3}>
              <Button
                colorScheme="blue"
                onClick={() => setIsEditModalOpen(true)}
                size="md"
                flex={1}
              >
                {texts.profile.edit[language]}
              </Button>
              <Button
                colorScheme="red"
                onClick={() => setIsDeleteConfirmOpen(true)}
                size="md"
                flex={1}
              >
                {texts.common.delete[language]}
              </Button>
            </HStack>
          )}
        </VStack>
      ),
    },
    {
      id: 'classes',
      label: texts.classes.title[language],
      content: (
        <>
          {classes.length === 0 ? (
            <Text color="gray.500" fontStyle="italic">
              {texts.profile.children.noChildren[language]}
            </Text>
          ) : (
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th>{texts.classes.name[language]}</Th>
                    <Th>{texts.classes.teachers[language]}</Th>
                    <Th>{texts.classes.confirmation.status[language]}</Th>
                    {canEdit && <Th>{texts.common.actions[language]}</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {classes.map((cls) => (
                    <Tr key={cls.id}>
                      <Td>
                        <Text fontWeight="medium">{cls.name}</Text>
                      </Td>
                      <Td>
                        <Text>
                          {cls.teacher_firstname} {cls.teacher_surname}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(cls.status)} variant="subtle">
                          {getStatusText(cls.status)}
                        </Badge>
                      </Td>
                      {canEdit && (
                        <Td>
                          {cls.status === 'pending' && (
                            <HStack spacing={2}>
                              <Button
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleConfirmChildClass(cls.id)}
                              >
                                {texts.classes.confirmation.accept[language]}
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleDenyChildClass(cls.id)}
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
          )}
        </>
      ),
    },
    ...(schedules.length > 0
      ? [
          {
            id: 'schedules',
            label: texts.schedule.title[language],
            content: (
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr>
                      <Th>{texts.schedule.name?.[language] || 'Name'}</Th>
                      <Th>{texts.schedule.category?.[language] || 'Category'}</Th>
                      <Th>{texts.schedule.status?.label?.[language] || 'Status'}</Th>
                      <Th>{texts.schedule.notes[language]}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {schedules.map((schedule) => (
                      <Tr key={schedule.id}>
                        <Td>
                          <Text fontWeight="medium">{schedule.name}</Text>
                        </Td>
                        <Td>
                          <Text>{schedule.category || '-'}</Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={
                              schedule.status === 'done'
                                ? 'green'
                                : schedule.status === 'in progress'
                                  ? 'blue'
                                  : 'gray'
                            }
                            variant="subtle"
                          >
                            {schedule.status || '-'}
                          </Badge>
                        </Td>
                        <Td>
                          <Text
                            maxW="250px"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            title={schedule.notes}
                          >
                            {schedule.notes || '-'}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ),
          },
        ]
      : []),
  ];

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Button
        leftIcon={<ChevronLeftIcon />}
        mb={4}
        onClick={() => navigate(ROUTES.CHILDREN)}
        size="md"
      >
        {texts.profile.children.addChild.title[language]} Detail
      </Button>

      <Card>
        <CardBody>
          <Tabs tabs={tabItems} variant="line" colorScheme="blue" />
        </CardBody>
      </Card>

      {/* Edit Child Modal */}
      {canEdit && childData && (
        <EditChildModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          childData={childData}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {canEdit && (
        <AlertDialog
          isOpen={isDeleteConfirmOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsDeleteConfirmOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader>
                {texts.profile.children.deleteConfirm.title[language]}
              </AlertDialogHeader>
              <AlertDialogBody>
                {texts.profile.children.deleteConfirm.message[language]} {childData.firstname}{' '}
                {childData.surname}?
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsDeleteConfirmOpen(false)}>
                  {texts.common.cancel[language]}
                </Button>
                <Button colorScheme="red" onClick={handleDeleteChild} ml={3}>
                  {texts.common.delete[language]}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}

      {/* Delete Class Confirmation Dialog */}
      {canEdit && (
        <AlertDialog
          isOpen={isClassDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClassDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader>Remove from Class</AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to remove {childData.firstname} from the class{' '}
                {classToDelete?.name}?
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClassDeleteClose}>
                  {texts.common.cancel[language]}
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => classToDelete && handleDeleteChildClass(classToDelete.id)}
                  ml={3}
                >
                  {texts.common.delete[language]}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </Box>
  );
};

export default ChildDetailPage;
