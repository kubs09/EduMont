import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { ChevronLeftIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { ChildExcuse, Document, getChildDocuments, getChildExcuses } from '@frontend/services/api';
import {
  checkPermissionRequest,
  checkPresentationPermission,
  requestPermission,
} from '@frontend/services/api/permission';
import { Child, UpdateChildData } from '@frontend/types/child';
import { Presentation } from '@frontend/types/presentation';
import { ROUTES } from '@frontend/shared/route';
import { PermissionAlertWindow } from '@frontend/classes/components/PremissionAlertWindow';
import EditChildModal from '../components/EditChildModal';
import { Section, SectionMenu } from '@frontend/shared/components';
import { ConfirmDialog } from '@frontend/shared/components/ConfirmDialog';
import {
  InformationSection,
  DocumentsSection,
  PresentationsSection,
  ExcusesSection,
} from '../sections';

const ChildDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [childData, setChildData] = useState<Child | null>(null);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [excuses, setExcuses] = useState<ChildExcuse[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('information');
  const cancelRef = React.useRef() as React.MutableRefObject<HTMLButtonElement>;
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  const isParent = userRole === 'parent';
  const [hasGrantedPresentationPermission, setHasGrantedPresentationPermission] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const canEdit = isAdmin;
  const canUpload = isAdmin || isTeacher || isParent;
  const canDeleteDocuments = isAdmin;
  const canViewParentProfile = isAdmin || isTeacher;

  const loadDocuments = async (childId: number) => {
    try {
      const documentsResponse = await getChildDocuments(childId);
      setDocuments(documentsResponse || []);
    } catch (err) {
      setDocuments([]);
    }
  };

  const loadExcuses = async (childId: number) => {
    try {
      const excusesResponse = await getChildExcuses(childId);
      setExcuses(excusesResponse || []);
    } catch (err) {
      setExcuses([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const childResponse = await api.get(`/api/children/${id}`);
        const child = childResponse.data;
        setChildData(child);

        try {
          if (isAdmin && child?.class_id) {
            const permissionResult = await checkPresentationPermission(child.class_id);
            setHasGrantedPresentationPermission(permissionResult.has_access);

            if (permissionResult.has_access) {
              const presentationsResponse = await api.get(`/api/children/${id}/presentations`);
              setPresentations(presentationsResponse.data || []);
            } else {
              setPresentations([]);
            }
          } else {
            const presentationsResponse = await api.get(`/api/children/${id}/presentations`);
            setPresentations(presentationsResponse.data || []);
          }
        } catch (err) {
          setPresentations([]);
        }

        try {
          await loadDocuments(parseInt(id));
        } catch (err) {
          setDocuments([]);
        }

        try {
          await loadExcuses(parseInt(id));
        } catch (err) {
          setExcuses([]);
        }
      } catch (error) {
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
  }, [id, language, toast, isAdmin]);

  useEffect(() => {
    const fetchPresentationPermission = async () => {
      if (!isAdmin) return;

      const classId = childData?.class_id || presentations[0]?.class_id;
      if (!classId) {
        setHasGrantedPresentationPermission(false);
        return;
      }

      try {
        const result = await checkPresentationPermission(classId);
        setHasGrantedPresentationPermission(result.has_access);
      } catch (error) {
        setHasGrantedPresentationPermission(false);
      }
    };

    fetchPresentationPermission();
  }, [isAdmin, childData?.class_id, presentations]);

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!isAdmin || hasGrantedPresentationPermission || !childData?.class_id) {
        return;
      }

      try {
        const result = await checkPermissionRequest(childData.class_id);
        setPermissionRequested(result.already_requested);
      } catch (error) {
        setPermissionRequested(false);
      }
    };

    checkExistingRequest();
  }, [isAdmin, hasGrantedPresentationPermission, childData?.class_id]);

  const handleRequestPresentationPermission = async () => {
    if (!childData?.class_id) return;

    try {
      setIsRequestingPermission(true);
      const response = await requestPermission({
        resource_type: 'class_presentations',
        resource_id: childData.class_id,
        reason: 'Admin requesting access to view child presentations',
        language,
      });

      setPermissionRequested(response.already_requested || true);

      if (!response.already_requested) {
        toast({
          title: texts.classes.detail.permissionRequestSent[language],
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: texts.classes.detail.permissionRequestError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const canUpdatePresentationStatus = isTeacher || (isAdmin && hasGrantedPresentationPermission);
  const showPresentationPermissionAlert =
    isAdmin && !!childData?.class_id && !hasGrantedPresentationPermission;

  useEffect(() => {
    const visibleSectionIds = [
      'information',
      ...(presentations.length > 0 || showPresentationPermissionAlert ? ['presentations'] : []),
      'excuses',
      'documents',
    ];
    if (!visibleSectionIds.includes(activeSectionId)) {
      setActiveSectionId(visibleSectionIds[0]);
    }
  }, [activeSectionId, presentations.length, showPresentationPermissionAlert]);

  const handleEditSave = async (updatedData: UpdateChildData) => {
    if (!childData || !id) return;

    try {
      const response = await api.put(`/api/children/${id}`, {
        firstname: updatedData.firstname || childData.firstname,
        surname: updatedData.surname || childData.surname,
        parent_ids: updatedData.parent_ids,
        notes: updatedData.notes || childData.notes,
        class_id: updatedData.class_id,
      });

      setChildData(response.data);
      setIsEditModalOpen(false);
      toast({
        title: texts.profile.success[language],
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
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

  const sectionItems = [
    {
      id: 'information',
      label: texts.profile.children.title[language],
      content: (
        <InformationSection
          childData={childData}
          language={language}
          canEdit={canEdit}
          canViewParentProfile={canViewParentProfile}
          onEditClick={() => setIsEditModalOpen(true)}
          onDeleteClick={() => setIsDeleteConfirmOpen(true)}
        />
      ),
    },
    {
      id: 'presentations',
      label: texts.presentation.title[language],
      content: showPresentationPermissionAlert ? (
        <PermissionAlertWindow
          title={texts.classes.detail.presentationsPermissionTitle[language]}
          message={texts.classes.detail.presentationsPermissionMessage[language]}
          onRequestPermission={handleRequestPresentationPermission}
          actionLabel={texts.classes.detail.requestPermissionButton[language]}
          submittedLabel={texts.classes.detail.requestSentButton[language]}
          isLoading={isRequestingPermission}
          premissionSubmitted={permissionRequested}
        />
      ) : (
        <PresentationsSection
          presentations={presentations}
          language={language}
          childId={id ? parseInt(id, 10) : 0}
          display_order={presentations.length > 0 ? presentations[0].display_order || 0 : 0}
          canUpdateStatus={canUpdatePresentationStatus}
          onStatusUpdated={(presentationId, newStatus) => {
            setPresentations((prev) =>
              prev.map((presentation) =>
                presentation.id === presentationId
                  ? { ...presentation, status: newStatus }
                  : presentation
              )
            );
          }}
        />
      ),
      isVisible: presentations.length > 0 || showPresentationPermissionAlert,
    },
    {
      id: 'excuses',
      label: texts.profile.children.excuse.historyTitle[language],
      content: (
        <ExcusesSection
          excuses={excuses}
          language={language}
          canViewParentProfile={canViewParentProfile}
        />
      ),
    },
    {
      id: 'documents',
      label: texts.document.title[language],
      content: (
        <DocumentsSection
          documents={documents}
          language={language}
          canUpload={canUpload}
          canDelete={canDeleteDocuments}
          childData={childData}
          onDocumentsUpdate={async () => {
            if (id) await loadDocuments(parseInt(id));
          }}
        />
      ),
    },
  ];

  const menuSections = sectionItems.map((item) => ({
    key: item.id,
    label: item.label,
    isVisible: item.isVisible,
  }));

  return (
    <Box p={{ base: 2, md: 4 }} pb={{ base: 20, md: 24 }}>
      <Card>
        <CardBody>
          <Flex align="center" mb={4} wrap="wrap" gap={2}>
            <Box display={{ base: 'block', md: 'none' }} order={{ base: 1, md: 1 }}>
              <IconButton
                aria-label={texts.profile.children.backButton[language]}
                icon={<ChevronLeftIcon />}
                size="sm"
                onClick={() => navigate(ROUTES.CHILDREN)}
              />
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              <Button
                leftIcon={<ChevronLeftIcon />}
                onClick={() => navigate(ROUTES.CHILDREN)}
                size="md"
                px={4}
                minW="auto"
              >
                {texts.profile.children.backButton[language]}
              </Button>
            </Box>
            <Box flex={{ base: '0 0 auto', md: '1' }} display={{ base: 'none', md: 'block' }} />
            <Heading
              size="lg"
              textAlign="center"
              flex={{ base: '1 1 100%', md: '0 1 auto' }}
              order={{ base: 3, md: 2 }}
            >
              {`${childData.firstname} ${childData.surname}`}
            </Heading>
            <Box
              flex={{ base: '1 1 auto', md: '1' }}
              display="flex"
              justifyContent="flex-end"
              ml={{ base: 0, md: 0 }}
              order={{ base: 2, md: 3 }}
            >
              {canEdit && (
                <HStack spacing={2}>
                  <IconButton
                    aria-label={texts.profile.edit[language]}
                    icon={<EditIcon />}
                    variant="brand"
                    size={{ base: 'sm', md: 'md' }}
                    onClick={() => setIsEditModalOpen(true)}
                  />
                  <IconButton
                    aria-label={texts.common.delete[language]}
                    icon={<DeleteIcon />}
                    variant="delete"
                    size={{ base: 'sm', md: 'md' }}
                    onClick={() => setIsDeleteConfirmOpen(true)}
                  />
                </HStack>
              )}
            </Box>
          </Flex>
          <Grid templateColumns={{ base: '1fr', md: '240px 1fr' }} gap={6} alignItems="start">
            <GridItem>
              <SectionMenu
                title={texts.profile.children.title[language]}
                sections={menuSections}
                activeKey={activeSectionId}
                onChange={setActiveSectionId}
              />
            </GridItem>
            <GridItem minW={0}>
              <VStack align="stretch" spacing={6}>
                {sectionItems
                  .filter((item) => item.isVisible !== false)
                  .filter((item) => item.id === activeSectionId)
                  .map((item) => (
                    <Box key={item.id} id={item.id} scrollMarginTop={{ base: 24, md: 20 }}>
                      <Section title={item.label}>{item.content}</Section>
                    </Box>
                  ))}
              </VStack>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
      {canEdit && childData && (
        <EditChildModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          childData={childData}
          onSave={handleEditSave}
        />
      )}
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
