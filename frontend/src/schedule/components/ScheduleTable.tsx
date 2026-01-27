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
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { Schedule } from '@frontend/types/schedule';

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'not started':
        return 'gray';
      case 'in progress':
        return 'blue';
      case 'done':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'not started':
        return texts.schedule.status?.options.notStarted[language] || 'Not Started';
      case 'in progress':
        return texts.schedule.status?.options.inProgress[language] || 'In Progress';
      case 'done':
        return texts.schedule.status?.options.done[language] || 'Done';
      default:
        return status;
    }
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
            <Th>{texts.schedule.name?.[language] || 'Name'}</Th>
            <Th>{texts.schedule.category?.[language] || 'Category'}</Th>
            <Th>{texts.schedule.status?.label?.[language] || 'Status'}</Th>
            {showChild && <Th>{texts.schedule.child[language]}</Th>}
            {showClass && <Th>{texts.schedule.class[language]}</Th>}
            <Th>{texts.schedule.notes[language]}</Th>
            {canEdit && <Th>{texts.common.actions[language]}</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {schedules.map((schedule) => (
            <Tr key={schedule.id}>
              <Td>
                <Text fontWeight="medium">{schedule.name}</Text>
              </Td>
              <Td>
                <Text>{schedule.category || '-'}</Text>
              </Td>
              <Td>
                <Badge
                  colorScheme={getStatusColor(schedule.status)}
                  variant="subtle"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {getStatusText(schedule.status)}
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
