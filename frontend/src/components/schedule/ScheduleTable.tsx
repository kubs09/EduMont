import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  HStack,
  Text,
  Badge,
  Box,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import { Schedule } from '../../types/schedule';

// Helper function to calculate end time from start time and duration
const calculateEndTime = (startTime: string, durationHours: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + durationHours;
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

interface ScheduleTableProps {
  schedules: Schedule[];
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
  canEdit?: boolean;
  showChild?: boolean;
  showClass?: boolean;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  onEdit,
  onDelete,
  canEdit = false,
  showChild = true,
  showClass = true,
}) => {
  const { language } = useLanguage();

  const formatTime = (time: string): string => {
    return time.substring(0, 5); // Remove seconds if present
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US');
  };

  if (schedules.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">{texts.schedule.noEntries[language]}</Text>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            <Th>{texts.schedule.date[language]}</Th>
            <Th>{texts.schedule.timeSlot[language]}</Th>
            {showChild && <Th>{texts.schedule.child[language]}</Th>}
            {showClass && <Th>{texts.schedule.class[language]}</Th>}
            <Th>{texts.schedule.activity[language]}</Th>
            <Th>{texts.schedule.notes[language]}</Th>
            {canEdit && <Th>{texts.common.actions[language]}</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {schedules.map((schedule) => (
            <Tr key={schedule.id}>
              <Td>
                <Text>{formatDate(schedule.date)}</Text>
              </Td>
              <Td>
                <Badge colorScheme="blue" variant="subtle" px={2} py={1} borderRadius="md">
                  {formatTime(schedule.start_time)} -{' '}
                  {formatTime(calculateEndTime(schedule.start_time, schedule.duration_hours))}
                </Badge>
              </Td>
              {showChild && (
                <Td>
                  <Text>
                    {schedule.child_firstname} {schedule.child_surname}
                  </Text>
                </Td>
              )}
              {showClass && (
                <Td>
                  <Text>{schedule.class_name}</Text>
                </Td>
              )}
              <Td>
                <Text>{schedule.activity || '-'}</Text>
              </Td>
              <Td>
                <Text
                  maxW="200px"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  title={schedule.notes}
                >
                  {schedule.notes || '-'}
                </Text>
              </Td>
              {canEdit && (
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Edit schedule"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => onEdit?.(schedule)}
                    />
                    <IconButton
                      aria-label="Delete schedule"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => onDelete?.(schedule)}
                    />
                  </HStack>
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default ScheduleTable;
