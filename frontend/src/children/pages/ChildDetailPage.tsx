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
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { Document, createDocument, getChildDocuments } from '@frontend/services/api';
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const cancelRef = React.useRef() as React.MutableRefObject<HTMLButtonElement>;
  const userRole = localStorage.getItem('userRole');
  const currentUserId = localStorage.getItem('userId');
  const isParent = userRole === 'parent';
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';

  const canEdit = isAdmin || (isParent && childData?.parent_id === parseInt(currentUserId || '0'));
  const canUpload = isAdmin || isTeacher;

  const loadDocuments = async (childId: number) => {
    try {
      const documentsResponse = await getChildDocuments(childId);
      setDocuments(documentsResponse || []);
    } catch (err) {
      setDocuments([]);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

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

        try {
          await loadDocuments(parseInt(id));
        } catch (err) {
          setDocuments([]);
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

  const handleUploadDocument = async () => {
    if (!id || !uploadFile) return;

    const maxBytes = 500 * 1024;
    if (uploadFile.size > maxBytes) {
      toast({
        title: texts.profile.error[language],
        description: texts.document.error.fileTooLarge[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsUploading(true);

      const dataUrl = await readFileAsDataUrl(uploadFile);
      const title = uploadTitle.trim() || uploadFile.name;

      await createDocument({
        title,
        description: uploadDescription.trim() || undefined,
        file_url: dataUrl,
        file_name: uploadFile.name,
        mime_type: uploadFile.type || undefined,
        size_bytes: uploadFile.size,
        child_id: parseInt(id),
        class_id: childData?.class_id || undefined,
      });

      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      await loadDocuments(parseInt(id));

      toast({
        title: texts.profile.success[language],
        description: texts.document.error.uploadSuccess[language],
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast({
        title: texts.profile.error[language],
        description: texts.document.error.uploadFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!childData) {
    return null;
  }

  const age = new Date().getFullYear() - new Date(childData.date_of_birth).getFullYear();
  const isAccepted = childData.status === 'accepted';

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
            {isAccepted && childData.class_id ? (
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
            ) : (
              <Badge colorScheme="yellow" variant="subtle" textTransform="capitalize">
                {childData.status || 'pending'}
              </Badge>
            )}
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
    {
      id: 'documents',
      label: texts.document.title[language],
      content: (
        <VStack align="stretch" spacing={4}>
          {canUpload && (
            <Box borderWidth="1px" borderRadius="md" p={4}>
              <Text fontWeight="bold" mb={3}>
                {texts.document.uploadDocument[language]}
              </Text>
              <VStack align="stretch" spacing={3}>
                <FormControl>
                  <FormLabel>{texts.document.title[language]}</FormLabel>
                  <Input
                    value={uploadTitle}
                    onChange={(event) => setUploadTitle(event.target.value)}
                    placeholder={texts.document.placeholder.title[language]}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>{texts.document.description[language]}</FormLabel>
                  <Textarea
                    value={uploadDescription}
                    onChange={(event) => setUploadDescription(event.target.value)}
                    placeholder={texts.document.placeholder.description[language]}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>{texts.document.file[language]}</FormLabel>
                  <Input
                    type="file"
                    onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  />
                </FormControl>
                <Button
                  colorScheme="blue"
                  onClick={handleUploadDocument}
                  isLoading={isUploading}
                  isDisabled={!uploadFile}
                >
                  {texts.document.uploadDocument[language]}
                </Button>
              </VStack>
            </Box>
          )}

          {documents.length > 0 ? (
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th>{texts.document.title[language]}</Th>
                    <Th>{texts.document.file[language]}</Th>
                    <Th>{texts.document.type[language]}</Th>
                    <Th>{texts.document.createdAt?.[language]}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {documents.map((doc) => (
                    <Tr key={doc.id}>
                      <Td>
                        <Text fontWeight="medium">{doc.title}</Text>
                        {doc.description && (
                          <Text fontSize="sm" color="gray.600">
                            {doc.description}
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Text
                          as="a"
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="blue.500"
                          textDecoration="underline"
                        >
                          {doc.file_name || doc.file_url}
                        </Text>
                      </Td>
                      <Td>
                        <Text>{doc.mime_type || '-'}</Text>
                      </Td>
                      <Td>
                        <Text>
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString(language)
                            : '-'}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Text color="gray.600">{texts.document.noDocuments[language]}</Text>
          )}
        </VStack>
      ),
    },
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
