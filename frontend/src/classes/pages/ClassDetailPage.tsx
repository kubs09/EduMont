import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, useToast } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { getClassNextActivities, NextActivity } from '@frontend/services/api/class';
import { ROUTES } from '@frontend/shared/route';
import { EditClassInfoModal } from '../components/EditClassInfoModal';
import { ManageClassTeachersModal } from '../components/ManageClassTeachersModal';
import Tabs, { TabItem } from '@frontend/shared/components/Tabs/Tabs';
import InfoTab from '../tabs/InfoTab';
import StudentsTab from '../tabs/StudentsTab';
import ActivitiesTab from '../tabs/ActivitiesTab';

import { Class } from '@frontend/types/class';

interface User {
  id: number;
  firstname: string;
  surname: string;
  role: string;
}

const transformClassData = (data: Class): Class => data;

const ClassDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [classData, setClassData] = useState<Class | null>(null);
  const [nextActivities, setNextActivities] = useState<NextActivity[]>([]);
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

  const handleSaveClassInfo = async (updatedInfo: {
    name: string;
    description: string;
    min_age: number;
    max_age: number;
    teacherId: number;
    assistantId: number | null;
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
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        texts.classes.updateError[language];
      console.error('Update error:', error);
      toast({
        title: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!classData) {
    return null;
  }

  const infoTabContent = (
    <InfoTab
      classData={classData}
      language={language}
      isAdmin={isAdmin}
      onEditClick={() => setIsEditInfoModalOpen(true)}
      onEditMembersClick={() => setIsMembersModalOpen(true)}
    />
  );

  const studentsTabContent = (
    <StudentsTab
      classData={classData}
      language={language}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isParent={isParent}
      currentUserId={currentUserId}
    />
  );

  const activitiesTabContent = (
    <ActivitiesTab
      classData={classData}
      nextActivities={nextActivities}
      language={language}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
    />
  );

  const classDetailTabs: TabItem[] = [
    {
      id: 'info',
      label: texts.classes.detail.info[language],
      content: infoTabContent,
    },
    {
      id: 'students',
      label: texts.classes.detail.students[language],
      content: studentsTabContent,
    },
    {
      id: 'activities',
      label: texts.classes.detail.nextActivities[language],
      content: activitiesTabContent,
    },
  ];

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

      <Tabs tabs={classDetailTabs} variant="line" colorScheme="blue" />

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
            onSave={({ teacherId, assistantId }) =>
              handleSaveClassInfo({
                name: classData.name,
                description: classData.description,
                min_age: classData.min_age,
                max_age: classData.max_age,
                teacherId,
                assistantId,
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
