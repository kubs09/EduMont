import React from 'react';
import { Text, Badge, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Schedule } from '@frontend/types/schedule';

interface SchedulesTabProps {
  schedules: Schedule[];
  language: 'cs' | 'en';
}

const SchedulesTab: React.FC<SchedulesTabProps> = ({ schedules, language }) => {
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

  return (
    <TableContainer>
      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            <Th>{texts.schedule.name[language]}</Th>
            <Th>{texts.schedule.category[language]}</Th>
            <Th>{texts.schedule.status.label[language]}</Th>
            <Th>{texts.schedule.notes[language]}</Th>
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
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default SchedulesTab;
