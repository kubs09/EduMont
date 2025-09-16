import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  Select,
  HStack,
  VStack,
  Input,
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
  Text,
} from '@chakra-ui/react';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import {
  getChildSchedule,
  getClassSchedule,
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
  }, [selectedChild, selectedClass, getDateFilters, language, toast]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [childrenData, classesData] = await Promise.all([getChildren(), getClasses()]);

      setChildrenList(childrenData);
      setClasses(classesData);

      if (isParent && childrenData.length > 0) {
        setSelectedChild(childrenData[0].id.toString());
      }
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
  }, [isParent, language, toast]);

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

                {!selectedChild && (
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

                <Box position="relative" maxW="200px">
                  <Input
                    type={viewType === 'month' ? 'month' : 'date'}
                    value={viewType === 'month' ? selectedDate.substring(0, 7) : selectedDate}
                    onChange={(e) => {
                      if (viewType === 'month') {
                        setSelectedDate(e.target.value + '-01');
                      } else {
                        setSelectedDate(e.target.value);
                      }
                    }}
                    color={language === 'cs' && viewType === 'month' ? 'transparent' : 'inherit'}
                    _focus={{
                      color: 'inherit',
                    }}
                  />
                  {language === 'cs' && viewType === 'month' && (
                    <Box
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      bottom="0"
                      display="flex"
                      alignItems="center"
                      paddingLeft="12px"
                      paddingRight="12px"
                      pointerEvents="none"
                    >
                      <Text fontSize="md" color="inherit">
                        {(() => {
                          const [year, month] = selectedDate.substring(0, 7).split('-');
                          const monthIndex = parseInt(month) - 1;
                          return `${texts.schedule.months.cs[monthIndex]} ${year}`;
                        })()}
                      </Text>
                    </Box>
                  )}
                </Box>
              </HStack>
            </VStack>
          </CardHeader>

          <CardBody>
            {!selectedChild && !selectedClass && !isParent && (
              <Alert status="info">
                <AlertIcon />
                {texts.schedule.selectClassOrChild[language]}
              </Alert>
            )}

            {(selectedChild || selectedClass || isParent) && (
              <ScheduleTable
                schedules={schedules}
                onEdit={canEdit ? handleEditSchedule : undefined}
                onDelete={canEdit ? handleDeleteSchedule : undefined}
                canEdit={canEdit}
                showChild={!selectedChild}
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
