import React, { useMemo, useState } from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  useToast,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Schedule } from '@frontend/types/schedule';
import { updateChildPresentationStatus } from '@frontend/services/api/child';

interface SchedulesTabProps {
  schedules: Schedule[];
  language: 'cs' | 'en';
  childId: number;
  canUpdateStatus?: boolean;
  onStatusUpdated?: (scheduleId: number, newStatus: Schedule['status']) => void;
}

const SchedulesTab: React.FC<SchedulesTabProps> = ({
  schedules,
  language,
  childId,
  canUpdateStatus = false,
  onStatusUpdated,
}) => {
  const toast = useToast();
  const [updatingScheduleId, setUpdatingScheduleId] = useState<number | null>(null);
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'prerequisites not met':
        return 'red';
      case 'to be presented':
        return 'orange';
      case 'presented':
        return 'blue';
      case 'practiced':
        return 'teal';
      case 'mastered':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'prerequisites not met':
        return (
          texts.schedule.status?.options.prerequisitesNotMet[language] || 'Prerequisites Not Met'
        );
      case 'to be presented':
        return texts.schedule.status?.options.toBePresented[language] || 'To Be Presented';
      case 'presented':
        return texts.schedule.status?.options.presented[language] || 'Presented';
      case 'practiced':
        return texts.schedule.status?.options.practiced[language] || 'Practiced';
      case 'mastered':
        return texts.schedule.status?.options.mastered[language] || 'Mastered';
      default:
        return status || '-';
    }
  };

  const statusOptions: Schedule['status'][] = [
    'prerequisites not met',
    'to be presented',
    'presented',
    'practiced',
    'mastered',
  ];

  const categories = useMemo(() => {
    const unique = new Set(
      schedules.map((schedule) => schedule.category).filter((category) => category)
    );
    return Array.from(unique).sort();
  }, [schedules]);

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const visibleSchedules = useMemo(() => {
    const filtered = selectedCategory
      ? schedules.filter((schedule) => schedule.category === selectedCategory)
      : schedules;

    return [...filtered].sort((a, b) => {
      const aOrder =
        typeof a.display_order === 'number' ? a.display_order : Number.MAX_SAFE_INTEGER;
      const bOrder =
        typeof b.display_order === 'number' ? b.display_order : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }, [schedules, selectedCategory]);

  const handleChangeStatus = async (scheduleId: number, newStatus: Schedule['status']) => {
    if (!canUpdateStatus) {
      return;
    }

    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule || schedule.status === newStatus) {
      return;
    }

    setUpdatingScheduleId(scheduleId);
    try {
      await updateChildPresentationStatus(childId, scheduleId, newStatus);
      onStatusUpdated?.(scheduleId, newStatus);
      toast({
        title: texts.schedule.messages.updateSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: texts.schedule.messages.updateError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdatingScheduleId(null);
    }
  };

  return (
    <Box>
      <HStack mb={3} spacing={2} align="center">
        <Text fontWeight="medium">{texts.schedule.category[language]}:</Text>
        <Select
          size="sm"
          maxW="220px"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
        >
          <option value="">{texts.schedule.select[language]}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </HStack>
      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>{texts.schedule.name[language]}</Th>
              <Th>{texts.schedule.category[language]}</Th>
              <Th>{texts.schedule.status.label[language]}</Th>
              <Th>{texts.schedule.notes[language]}</Th>
              <Th>{texts.common.actions[language]}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {visibleSchedules.map((schedule) => (
              <Tr key={schedule.id}>
                <Td>
                  <Text fontWeight="medium">{schedule.name}</Text>
                </Td>
                <Td>
                  <Text>{schedule.category || '-'}</Text>
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(schedule.status)} variant="subtle">
                    {getStatusText(schedule.status)}
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
                <Td>
                  {canUpdateStatus ? (
                    <Select
                      color="blue.500"
                      cursor="pointer"
                      value={schedule.status}
                      onChange={(event) =>
                        handleChangeStatus(schedule.id, event.target.value as Schedule['status'])
                      }
                      isDisabled={updatingScheduleId === schedule.id}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {getStatusText(status)}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Text color="gray.500">-</Text>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SchedulesTab;
