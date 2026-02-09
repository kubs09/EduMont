import React from 'react';
import { Text, Badge, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Schedule } from '@frontend/types/schedule';

interface SchedulesTabProps {
  schedules: Schedule[];
  language: 'cs' | 'en';
}

const SchedulesTab: React.FC<SchedulesTabProps> = ({ schedules, language }) => {
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
                <Badge
                  colorScheme={
                    schedule.status === 'done'
                      ? 'green'
                      : schedule.status === 'in progress'
                        ? 'blue'
                        : 'gray'
                  }
                  variant="subtle"
                >
                  {schedule.status || '-'}
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
