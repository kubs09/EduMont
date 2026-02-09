import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  VStack,
  Box,
  Link as ChakraLink,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { Class } from '@frontend/types/class';
import { ROUTES } from '@frontend/shared/route';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@frontend/shared/components';
import { ChildExcuse } from '@frontend/services/api/child';
import { formatDate } from '@frontend/shared/components/DatePicker/utils/utils';

interface StudentsTabProps {
  classData: Class;
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  currentUserId: number | null;
  excusesByChildId: Record<number, ChildExcuse[]>;
}

const StudentsTab: React.FC<StudentsTabProps> = ({
  classData,
  language,
  isAdmin,
  isTeacher,
  isParent,
  currentUserId,
  excusesByChildId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const canViewParentProfile = isAdmin || isTeacher;
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const visibleChildren = useMemo(() => {
    const allChildren = classData.children;
    if (isAdmin || isTeacher) return allChildren;
    if (isParent) {
      return allChildren.filter((child) =>
        child.parents.some((parent) => parent.id === currentUserId)
      );
    }
    return [];
  }, [classData.children, currentUserId, isAdmin, isParent, isTeacher]);

  const totalPages = Math.ceil(visibleChildren.length / DEFAULT_PAGE_SIZE);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const paginatedChildren = visibleChildren.slice(
    (safeCurrentPage - 1) * DEFAULT_PAGE_SIZE,
    safeCurrentPage * DEFAULT_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const formatParentContacts = (parents: Class['children'][number]['parents']) =>
    parents.map((parent) => parent.phone || parent.email);

  const getActiveExcuse = (childId: number) => {
    const excuses = excusesByChildId[childId] || [];
    if (!excuses.length) return null;

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const parseDate = (value: string) => {
      const direct = new Date(value);
      if (!Number.isNaN(direct.getTime())) return direct;
      const fallback = new Date(`${value}T00:00:00`);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const active = excuses.find((excuse) => {
      const fromDate = parseDate(excuse.date_from);
      const toDate = parseDate(excuse.date_to);
      if (!fromDate || !toDate) return false;
      return todayDate >= fromDate && todayDate <= toDate;
    });

    return active || null;
  };

  const formatExcuseDate = (value: string) => {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return formatDate(direct, language);
    const fallback = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(fallback.getTime())) return formatDate(fallback, language);
    return value;
  };

  return (
    <Box w="full" overflowX="auto">
      <TableContainer w="full" maxW="100%" overflowX="auto">
        <Table variant="simple" size="md" minW="max-content">
          <Thead>
            <Tr>
              <Th>{texts.childrenTable.firstname[language]}</Th>
              <Th>{texts.childrenTable.surname[language]}</Th>
              <Th>{texts.childrenTable.age[language]}</Th>
              {(isAdmin || isTeacher) && <Th>{texts.childrenTable.parent[language]}</Th>}
              {(isAdmin || isTeacher) && <Th>{texts.childrenTable.contact[language]}</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {paginatedChildren.map((child) => (
              <Tr key={child.id}>
                <Td>
                  <VStack align="start" spacing={1}>
                    <Text>{child.firstname}</Text>
                    {(() => {
                      const activeExcuse = getActiveExcuse(child.id);
                      return activeExcuse ? (
                        <Text fontSize="sm" color="orange.500">
                          {texts.profile.children.excuse.status[language]} (
                          {formatExcuseDate(activeExcuse.date_from)}
                          {' - '}
                          {formatExcuseDate(activeExcuse.date_to)})
                        </Text>
                      ) : null;
                    })()}
                  </VStack>
                </Td>
                <Td>{child.surname}</Td>
                <Td>{child.age}</Td>
                {(isAdmin || isTeacher) && (
                  <Td>
                    <VStack align="start" spacing={1}>
                      {child.parents.map((parent) => {
                        const fullName = `${parent.firstname} ${parent.surname}`;
                        return (
                          <Text key={`${child.id}-parent-name-${parent.id}`}>
                            {canViewParentProfile ? (
                              <ChakraLink
                                as={RouterLink}
                                to={ROUTES.PROFILE_DETAIL.replace(':id', parent.id.toString())}
                                color={linkColor}
                              >
                                {fullName}
                              </ChakraLink>
                            ) : (
                              fullName
                            )}
                          </Text>
                        );
                      })}
                    </VStack>
                  </Td>
                )}
                {(isAdmin || isTeacher) && (
                  <Td>
                    <VStack align="start" spacing={1}>
                      {formatParentContacts(child.parents).map((contact, parentIndex) => (
                        <Text key={`${child.id}-parent-contact-${parentIndex}`}>{contact}</Text>
                      ))}
                    </VStack>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {visibleChildren.length > 0 && (
        <TablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={DEFAULT_PAGE_SIZE}
          totalCount={visibleChildren.length}
        />
      )}
    </Box>
  );
};

export default StudentsTab;
