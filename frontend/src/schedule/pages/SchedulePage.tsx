import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  HStack,
  VStack,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '@frontend/services/api/schedule';
import { getChildren } from '@frontend/services/api/child';
import { getClasses } from '@frontend/services/api/class';
import { Schedule, CreateScheduleData, UpdateScheduleData } from '@frontend/types/schedule';
import { Child } from '@frontend/types/child';
import { Class } from '@frontend/types/class';
import ScheduleModal from '@frontend/schedule/components/ScheduleModal';
import ScheduleTable from '@frontend/schedule/components/ScheduleTable';

const SchedulePage: React.FC = () => {
  const { language } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const userRole = localStorage.getItem('userRole') || '';
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  const isParent = userRole === 'parent';
  const canEdit = isAdmin || isTeacher;

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const scheduleData = await getAllSchedules();
      setSchedules(scheduleData);
    } catch (error) {
      toast({
        title: texts.schedule.messages.fetchError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [language, toast]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [childrenData, classesData] = await Promise.all([getChildren(), getClasses()]);
      setChildrenList(childrenData);
      setClasses(classesData);
    } catch (error) {
      toast({
        title: texts.schedule.messages.fetchError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [language, toast]);

  const refreshData = useCallback(async () => {
    try {
      await loadSchedules();
      toast({
        title: texts.schedule.messages.refreshSuccess[language],
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: texts.schedule.messages.refreshError[language],
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [loadSchedules, toast, language]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (childrenList.length > 0 || classes.length > 0) {
      loadSchedules();
    }
  }, [childrenList.length, classes.length, loadSchedules]);

  const handleCreateSchedule = async (scheduleData: CreateScheduleData) => {
    await createSchedule(scheduleData);
    await loadSchedules();
  };

  const handleUpdateSchedule = async (scheduleData: UpdateScheduleData) => {
    await updateSchedule(scheduleData);
    await loadSchedules();
  };

  const handleSaveSchedule = async (scheduleData: CreateScheduleData | UpdateScheduleData) => {
    if ('id' in scheduleData) {
      await handleUpdateSchedule(scheduleData);
    } else {
      await handleCreateSchedule(scheduleData);
    }
    setEditingSchedule(null);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    onOpen();
  };

  const handleDeleteSchedule = async (schedule: Schedule) => {
    if (window.confirm(texts.schedule.confirmDelete[language])) {
      try {
        await deleteSchedule(schedule.id);
        await loadSchedules();
        toast({
          title: texts.schedule.messages.deleteSuccess[language],
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: texts.schedule.messages.deleteError[language],
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    onOpen();
  };

  const getDefaultChildId = (): number | undefined => {
    if (isParent && childrenList.length > 0) return childrenList[0].id;
    return undefined;
  };

  if (loading && schedules.length === 0) {
    return (
      <Center p={8}>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <HStack justify="space-between" wrap="wrap" spacing={4} mb={2}>
              <Heading size={{ base: 'md', md: 'lg' }}>{texts.schedule.title[language]}</Heading>
              <HStack spacing={2}>
                <Button
                  leftIcon={<RepeatIcon />}
                  variant="outline"
                  onClick={refreshData}
                  size={{ base: 'sm', md: 'md' }}
                >
                  {texts.schedule.refresh[language]}
                </Button>
                {canEdit && (
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={handleAddSchedule}
                    size={{ base: 'sm', md: 'md' }}
                  >
                    {texts.schedule.addEntry[language]}
                  </Button>
                )}
              </HStack>
            </HStack>
            <ScheduleTable
              schedules={schedules}
              onEdit={canEdit ? handleEditSchedule : undefined}
              onDelete={canEdit ? handleDeleteSchedule : undefined}
              canEdit={canEdit}
              showChild={true}
              showClass={true}
            />
          </CardBody>
        </Card>
      </VStack>

      <ScheduleModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSaveSchedule}
        schedule={editingSchedule}
        childrenData={childrenList}
        defaultChildId={getDefaultChildId()}
      />
    </Box>
  );
};

export default SchedulePage;
