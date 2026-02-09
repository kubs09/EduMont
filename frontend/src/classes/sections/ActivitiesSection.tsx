import React, { useEffect, useState } from 'react';
import { Box, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { NextActivity } from '@frontend/services/api/class';
import { Class } from '@frontend/types/class';
import TablePagination from '@frontend/shared/components/TablePagination/TablePagination';

interface ActivitiesTabProps {
  classData: Class;
  nextActivities: NextActivity[];
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
}

const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  classData,
  nextActivities,
  language,
  isAdmin,
  isTeacher,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  const filteredActivities = nextActivities.filter((activity) =>
    classData.children.some((child) => child.id === activity.child_id)
  );

  const totalPages = Math.ceil(filteredActivities.length / PAGE_SIZE);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const paginatedActivities = filteredActivities.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  return (
    <Box>
      {filteredActivities.length === 0 ? (
        <Text color="gray.500" fontStyle="italic">
          {texts.classes.detail.noNextActivities[language]}
        </Text>
      ) : (
        <TableContainer>
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th>{texts.childrenTable.firstname[language]}</Th>
                <Th>{texts.childrenTable.surname[language]}</Th>
                <Th>{texts.classes.detail.activity[language]}</Th>
                {(isAdmin || isTeacher) && <Th>{texts.classes.detail.notes[language]}</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {paginatedActivities.map((activity) => (
                <Tr key={`${activity.child_id}-${activity.id}`}>
                  <Td>{activity.firstname}</Td>
                  <Td>{activity.surname}</Td>
                  <Td>{activity.activity || '-'}</Td>
                  {(isAdmin || isTeacher) && <Td>{activity.notes || '-'}</Td>}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
      {filteredActivities.length > 0 && (
        <TablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={PAGE_SIZE}
          totalCount={filteredActivities.length}
        />
      )}
    </Box>
  );
};

export default ActivitiesTab;
