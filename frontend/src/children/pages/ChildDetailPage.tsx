import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardBody, useToast } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { Document, getChildDocuments } from '@frontend/services/api';
import { Child } from '@frontend/types/child';
import { Schedule } from '@frontend/types/schedule';
import { ROUTES } from '@frontend/shared/route';
import EditChildModal from '../components/EditChildModal';
import { Tabs, TabItem } from '@frontend/shared/components/Tabs';
import { ConfirmDialog } from '@frontend/shared/components/ConfirmDialog';
import InformationTab from '../components/tabs/InformationTab';
import SchedulesTab from '../components/tabs/SchedulesTab';
import DocumentsTab from '../components/tabs/DocumentsTab';

const ChildDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [childData, setChildData] = useState<Child | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
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

  if (!childData) {
    return null;
  }

  const tabItems: TabItem[] = [
    {
      id: 'information',
      label: texts.profile.children.title[language],
      content: (
        <InformationTab
          childData={childData}
          language={language}
          canEdit={canEdit}
          onEditClick={() => setIsEditModalOpen(true)}
          onDeleteClick={() => setIsDeleteConfirmOpen(true)}
        />
      ),
    },
    ...(schedules.length > 0
      ? [
          {
            id: 'schedules',
            label: texts.schedule.title[language],
            content: <SchedulesTab schedules={schedules} language={language} />,
          },
        ]
      : []),
    {
      id: 'documents',
      label: texts.document.title[language],
      content: (
        <DocumentsTab
          documents={documents}
          language={language}
          canUpload={canUpload}
          childData={childData}
          onDocumentsUpdate={async () => {
            if (id) await loadDocuments(parseInt(id));
          }}
        />
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
