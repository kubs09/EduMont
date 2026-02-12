import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import api from '@frontend/services/apiConfig';
import { getClassNextActivities, NextActivity } from '@frontend/services/api/class';
import { ChildExcuse, getChildExcuses } from '@frontend/services/api/child';
import { ROUTES } from '@frontend/shared/route';
import { EditClassInfoModal } from '../components/EditClassInfoModal';
import { ManageClassTeachersModal } from '../components/ManageClassTeachersModal';
import Section from '@frontend/shared/components/Section/Section';
import { SectionMenu } from '@frontend/shared/components';
import { InfoSection, StudentsSection, ActivitiesSection, AttendanceSection } from '../sections';

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
  const [activeSectionId, setActiveSectionId] = useState('info');
  const [excusesByChildId, setExcusesByChildId] = useState<Record<number, ChildExcuse[]>>({});

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

  useEffect(() => {
    if (!classData?.children?.length) {
      setExcusesByChildId({});
      return;
    }

    let isActive = true;

    const fetchExcuses = async () => {
      const entries = await Promise.all(
        classData.children.map(async (child) => {
          try {
            const excuses = await getChildExcuses(child.id);
            return [child.id, excuses] as const;
          } catch (error) {
            return [child.id, []] as const;
          }
        })
      );

      if (isActive) {
        setExcusesByChildId(Object.fromEntries(entries));
      }
    };

    fetchExcuses();

    return () => {
      isActive = false;
    };
  }, [classData?.children]);

  const refreshExcusesForChild = async (childId: number) => {
    try {
      const excuses = await getChildExcuses(childId);
      setExcusesByChildId((prev) => ({
        ...prev,
        [childId]: excuses,
      }));
    } catch (error) {
      setExcusesByChildId((prev) => ({
        ...prev,
        [childId]: [],
      }));
    }
  };

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
    <InfoSection
      classData={classData}
      language={language}
      isAdmin={isAdmin}
      onEditClick={() => setIsEditInfoModalOpen(true)}
      onEditMembersClick={() => setIsMembersModalOpen(true)}
    />
  );

  const studentsTabContent = (
    <StudentsSection
      classData={classData}
      language={language}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isParent={isParent}
      currentUserId={currentUserId}
      excusesByChildId={excusesByChildId}
      onRefreshExcuses={refreshExcusesForChild}
    />
  );

  const activitiesTabContent = (
    <ActivitiesSection
      classData={classData}
      nextActivities={nextActivities}
      language={language}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      excusesByChildId={excusesByChildId}
    />
  );

  const attendanceTabContent = (
    <AttendanceSection
      classData={classData}
      language={language}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isParent={isParent}
      currentUserId={currentUserId}
      excusesByChildId={excusesByChildId}
    />
  );

  const sectionItems = [
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
    {
      id: 'attendance',
      label: texts.classes.detail.attendance[language],
      content: attendanceTabContent,
    },
  ];

  const menuSections = sectionItems.map((item) => ({
    key: item.id,
    label: item.label,
  }));

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Card>
        <CardBody>
          <Flex align="center" mb={4} wrap="wrap" gap={3}>
            <Box display={{ base: 'block', md: 'none' }}>
              <IconButton
                aria-label={texts.classes.detail.backToList[language]}
                icon={<ChevronLeftIcon />}
                onClick={() => navigate(ROUTES.CLASSES)}
                size="md"
              />
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              <Button
                leftIcon={<ChevronLeftIcon />}
                onClick={() => navigate(ROUTES.CLASSES)}
                size="md"
                px={4}
                minW="auto"
              >
                {texts.classes.detail.backToList[language]}
              </Button>
            </Box>
            <Text flex={1} textAlign="center" fontSize="2xl" fontWeight="bold">
              {classData.name}
            </Text>
            <Box display={{ base: 'block', md: 'none' }}>
              <IconButton
                aria-label={texts.classes.detail.backToList[language]}
                icon={<ChevronLeftIcon />}
                size="md"
                visibility="hidden"
              />
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              <Button
                leftIcon={<ChevronLeftIcon />}
                size="md"
                px={4}
                minW="auto"
                visibility="hidden"
              >
                {texts.classes.detail.backToList[language]}
              </Button>
            </Box>
          </Flex>
          <Grid templateColumns={{ base: '1fr', lg: '240px 1fr' }} gap={6} alignItems="start">
            <GridItem>
              <SectionMenu
                title={texts.classes.detail.title[language]}
                sections={menuSections}
                activeKey={activeSectionId}
                onChange={setActiveSectionId}
              />
            </GridItem>
            <GridItem minW={0}>
              <VStack align="stretch" spacing={6}>
                {sectionItems
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
