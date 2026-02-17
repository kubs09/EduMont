import React, { useEffect, useState } from 'react';
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
import { TablePagination } from '@frontend/shared/components';

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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  const totalPages = Math.ceil(schedules.length / PAGE_SIZE);
  const paginatedSchedules = schedules.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
          {paginatedSchedules.map((schedule) => (
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
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={PAGE_SIZE}
        totalCount={schedules.length}
      />
    </TableContainer>
  );
};

export default ScheduleTable;
