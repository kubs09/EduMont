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
import { getClassNextPresentations, NextPresentation } from '@frontend/services/api/class';
import { ChildExcuse, getChildExcuses } from '@frontend/services/api/child';
import {
  acceptPermissionRequest,
  checkPresentationPermission,
  denyPermissionRequest,
  getPendingPermissionRequests,
  PendingPermissionRequest,
} from '@frontend/services/api/permission';
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
  const [nextPresentations, setNextPresentations] = useState<NextPresentation[]>([]);
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);
  const [activeSectionId, setActiveSectionId] = useState('info');
  const [excusesByChildId, setExcusesByChildId] = useState<Record<number, ChildExcuse[]>>({});
  const [pendingPermissions, setPendingPermissions] = useState<PendingPermissionRequest[]>([]);
  const [hasGrantedPermission, setHasGrantedPermission] = useState(false);

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

        const fetchNextPresentations = async () => {
          try {
            if (!id) return;
            const presentations = await getClassNextPresentations(parseInt(id));
            setNextPresentations(presentations);
          } catch (error) {
            toast({
              title: 'Error',
              description: 'Failed to load next presentations',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        };

        const fetchPendingPermissions = async () => {
          try {
            if (!id) return;
            const pending = await getPendingPermissionRequests(parseInt(id));
            setPendingPermissions(pending.requests || []);
          } catch (error) {
            setPendingPermissions([]);
          }
        };

        const fetchGrantedPermission = async () => {
          try {
            if (!id || !isUserAdmin) return;
            const result = await checkPresentationPermission(parseInt(id));
            setHasGrantedPermission(result.has_access);
          } catch (error) {
            setHasGrantedPermission(false);
          }
        };

        fetchClassData();
        if (id) {
          fetchNextPresentations();
          fetchPendingPermissions();
          fetchGrantedPermission();
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

  const isCurrentUserTeacherOfClass =
    !!currentUserId &&
    !!classData?.teachers?.some(
      (teacher) =>
        teacher.id === currentUserId &&
        (teacher.class_role === 'teacher' || teacher.class_role === 'assistant')
    );

  const hasPremissionRequestRecieved = isCurrentUserTeacherOfClass && pendingPermissions.length > 0;

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

  const handleAcceptPermission = async () => {
    if (!id) return;

    try {
      await acceptPermissionRequest(parseInt(id), language);

      const pending = await getPendingPermissionRequests(parseInt(id));
      setPendingPermissions(pending.requests || []);

      try {
        const result = await checkPresentationPermission(parseInt(id));
        setHasGrantedPermission(result.has_access);
      } catch (error) {}

      const updatedClass = await api.get(`/api/classes/${id}`);
      setClassData(updatedClass.data);

      toast({
        title: texts.classes.detail.permissionAccepted[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Accept permission error:', error);
      toast({
        title: texts.classes.detail.permissionAcceptError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDenyPermission = async () => {
    if (!id) return;

    try {
      await denyPermissionRequest(parseInt(id), language);

      const pending = await getPendingPermissionRequests(parseInt(id));
      setPendingPermissions(pending.requests || []);

      try {
        const result = await checkPresentationPermission(parseInt(id));
        setHasGrantedPermission(result.has_access);
      } catch (error) {}

      toast({
        title: texts.classes.detail.permissionDenied[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Deny permission error:', error);
      toast({
        title: texts.classes.detail.permissionDenyError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const canViewPresentations =
    !!currentUserId &&
    (!!classData?.teachers?.some(
      (teacher) =>
        teacher.id === currentUserId &&
        (teacher.class_role === 'teacher' || teacher.class_role === 'assistant')
    ) ||
      (isAdmin && hasGrantedPermission));

  const canAccessPresentationsSection = canViewPresentations || isAdmin;

  useEffect(() => {
    if (!canAccessPresentationsSection && activeSectionId === 'presentations') {
      setActiveSectionId('info');
    }
  }, [activeSectionId, canAccessPresentationsSection]);

  if (!classData) {
    return null;
  }

  const infoTabContent = (
    <InfoSection
      classData={classData}
      language={language}
      isAdmin={isAdmin}
      premissionRequested={hasPremissionRequestRecieved || false}
      pendingPermissions={pendingPermissions}
      onEditClick={() => setIsEditInfoModalOpen(true)}
      onEditMembersClick={() => setIsMembersModalOpen(true)}
      onAcceptPermission={handleAcceptPermission}
      onDenyPermission={handleDenyPermission}
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

  const activitiesTabContent = canAccessPresentationsSection ? (
    <ActivitiesSection
      classData={classData}
      nextPresentations={nextPresentations}
      language={language}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      hasPresentationPermission={canViewPresentations}
      excusesByChildId={excusesByChildId}
    />
  ) : null;

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
    ...(canAccessPresentationsSection
      ? [
          {
            id: 'presentations',
            label: texts.classes.detail.nextPresentations[language],
            content: activitiesTabContent,
          },
        ]
      : []),
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
