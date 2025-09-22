import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Select,
  HStack,
  VStack,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Card,
  CardHeader,
  CardBody,
  ButtonGroup,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import {
  getChildSchedule,
  getClassSchedule,
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../../services/api/schedule';
import { getChildren } from '../../services/api/child';
import { getClasses } from '../../services/api/class';
import {
  Schedule,
  CreateScheduleData,
  UpdateScheduleData,
  ScheduleViewType,
} from '../../types/schedule';
import { Child } from '../../types/child';
import { Class } from '../../types/class';
import ScheduleModal from '../components/ScheduleModal';
import ScheduleTable from '../components/ScheduleTable';
import { DatePicker } from '../../shared/components/DatePicker';

const SchedulePage: React.FC = () => {
  const { language } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [viewType, setViewType] = useState<ScheduleViewType>('week');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const userRole = localStorage.getItem('userRole') || '';
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  const isParent = userRole === 'parent';
  const canEdit = isAdmin || isTeacher;

  const getDateFilters = useCallback(() => {
    const date = new Date(selectedDate);
    switch (viewType) {
      case 'day':
        return { date: selectedDate };
      case 'week':
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        return { week: monday.toISOString().split('T')[0] };
      case 'month':
        return { month: selectedDate.substring(0, 7) };
      default:
        return {};
    }
  }, [selectedDate, viewType]);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      let scheduleData: Schedule[] = [];

      const filters = getDateFilters();

      if (selectedChild) {
        scheduleData = await getChildSchedule(parseInt(selectedChild), filters);
      } else if (selectedClass) {
        scheduleData = await getClassSchedule(parseInt(selectedClass), filters);
      } else if (canEdit) {
        scheduleData = await getAllSchedules(filters);
      } else if (isParent && !selectedChild) {
        const childSchedulePromises = childrenList.map((child) =>
          getChildSchedule(child.id, filters)
        );
        const allChildSchedules = await Promise.all(childSchedulePromises);
        scheduleData = allChildSchedules.flat().sort((a, b) => {
          const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        });
      }

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
  }, [
    selectedChild,
    selectedClass,
    getDateFilters,
    language,
    toast,
    canEdit,
    isParent,
    childrenList,
  ]);

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

  const refreshChildrenList = useCallback(async () => {
    try {
      const childrenData = await getChildren();
      setChildrenList(childrenData);

      if (selectedChild && !childrenData.find((c) => c.id.toString() === selectedChild)) {
        setSelectedChild('');
      }

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
  }, [selectedChild, toast, language]);

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
    if (selectedChild) return parseInt(selectedChild);
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
        <HStack justify="space-between" wrap="wrap" spacing={4}>
          <Heading size={{ base: 'md', md: 'lg' }}>{texts.schedule.title[language]}</Heading>
          <HStack spacing={2}>
            <Button
              leftIcon={<RepeatIcon />}
              variant="outline"
              onClick={refreshChildrenList}
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

        <Card>
          <CardHeader>
            <VStack spacing={4} align="stretch">
              <HStack wrap="wrap" spacing={4}>
                {isParent && childrenList.length > 1 && (
                  <Box>
                    <Select
                      placeholder={`${texts.schedule.select[language]} ${texts.schedule.child[language].toLowerCase()}`}
                      value={selectedChild}
                      onChange={(e) => {
                        setSelectedChild(e.target.value);
                        setSelectedClass('');
                      }}
                      maxW="200px"
                    >
                      {childrenList.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.firstname} {child.surname}
                        </option>
                      ))}
                    </Select>
                  </Box>
                )}

                {!isParent && (
                  <Box>
                    <Select
                      placeholder={`${texts.schedule.select[language]} ${texts.schedule.child[language].toLowerCase()}`}
                      value={selectedChild}
                      onChange={(e) => {
                        setSelectedChild(e.target.value);
                        setSelectedClass('');
                      }}
                      maxW="200px"
                    >
                      {childrenList.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.firstname} {child.surname}
                        </option>
                      ))}
                    </Select>
                  </Box>
                )}

                {!selectedChild && !isParent && (
                  <Box>
                    <Select
                      placeholder={`${texts.schedule.select[language]} ${texts.schedule.class[language].toLowerCase()}`}
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      maxW="200px"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </Select>
                  </Box>
                )}
              </HStack>

              <HStack wrap="wrap" spacing={4}>
                <ButtonGroup size="sm" isAttached variant="outline">
                  <Button
                    onClick={() => setViewType('day')}
                    colorScheme={viewType === 'day' ? 'blue' : 'gray'}
                  >
                    {texts.schedule.viewOptions.day[language]}
                  </Button>
                  <Button
                    onClick={() => setViewType('week')}
                    colorScheme={viewType === 'week' ? 'blue' : 'gray'}
                  >
                    {texts.schedule.viewOptions.week[language]}
                  </Button>
                  <Button
                    onClick={() => setViewType('month')}
                    colorScheme={viewType === 'month' ? 'blue' : 'gray'}
                  >
                    {texts.schedule.viewOptions.month[language]}
                  </Button>
                </ButtonGroup>

                <DatePicker
                  viewType={viewType}
                  value={selectedDate}
                  onChange={(value) => {
                    setSelectedDate(value);
                  }}
                  language={language}
                />
              </HStack>
            </VStack>
          </CardHeader>

          <CardBody>
            {!selectedChild && !selectedClass && isParent && childrenList.length === 0 && (
              <Alert status="info">
                <AlertIcon />
                {texts.schedule.selectClassOrChild[language]}
              </Alert>
            )}

            {(selectedChild ||
              selectedClass ||
              (isParent && childrenList.length > 0) ||
              canEdit) && (
              <ScheduleTable
                schedules={schedules}
                onEdit={canEdit ? handleEditSchedule : undefined}
                onDelete={canEdit ? handleDeleteSchedule : undefined}
                canEdit={canEdit}
                showChild={isParent ? true : !selectedChild}
                showClass={!selectedClass}
              />
            )}
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
        defaultDate={selectedDate}
      />
    </Box>
  );
};

export default SchedulePage;
