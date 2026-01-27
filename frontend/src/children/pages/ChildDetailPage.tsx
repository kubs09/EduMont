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
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { Child } from '@frontend/types/child';
import { Schedule } from '@frontend/types/schedule';
import { ROUTES } from '@frontend/shared/route';
import EditChildModal from '../components/EditChildModal';
import { Tabs, TabItem } from '@frontend/shared/components/Tabs';
import { ConfirmDialog } from '@frontend/shared/components/ConfirmDialog';

const ChildDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [childData, setChildData] = useState<Child | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
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
            <Text fontWeight="bold">{texts.childrenTable.class[language]}</Text>
            <Text
              as="button"
              color="blue.500"
              textDecoration="underline"
              cursor="pointer"
              _hover={{ color: 'blue.700' }}
              onClick={() => {
                if (childData.class_id) {
                  navigate(ROUTES.CLASS_DETAIL.replace(':id', childData.class_id.toString()));
                }
              }}
            >
              {childData.class_name}
            </Text>
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
        {texts.profile.children.backButton[language]}
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
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteChild}
          title={texts.profile.children.deleteConfirm.title[language]}
          message={`${texts.profile.children.deleteConfirm.message[language]} ${childData.firstname} ${childData.surname}?`}
          cancelLabel={texts.common.cancel[language]}
          confirmLabel={texts.common.delete[language]}
          confirmColorScheme="red"
        />
      )}
    </Box>
  );
};

export default ChildDetailPage;
