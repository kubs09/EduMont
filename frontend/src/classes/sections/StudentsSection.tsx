import React, { useEffect, useMemo, useState } from 'react';
import { Table, Text, VStack, Box, Link as ChakraLink } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { Class } from '@frontend/types/class';
import { ROUTES } from '@frontend/shared/route';
import { ChildExcuseAction, DEFAULT_PAGE_SIZE, TablePagination } from '@frontend/shared/components';
import { ChildExcuse } from '@frontend/types/child';
import { formatDate } from '@frontend/shared/components/DatePicker/utils/utils';

interface StudentsTabProps {
  classData: Class;
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  currentUserId: number | null;
  excusesByChildId: Record<number, ChildExcuse[]>;
  onRefreshExcuses: (childId: number) => Promise<void>;
}

const StudentsTab: React.FC<StudentsTabProps> = ({
  classData,
  language,
  isAdmin,
  isTeacher,
  isParent,
  currentUserId,
  excusesByChildId,
  onRefreshExcuses,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const canViewParentProfile = isAdmin || isTeacher;
  const linkColor = 'fg-brand';
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
      <Table.ScrollArea w="full" maxW="100%" overflowX="auto">
        <Table.Root variant="line" size="md" minW="max-content">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{texts.common.childrenTable.name[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.common.childrenTable.age[language]}</Table.ColumnHeader>
              {(isAdmin || isTeacher) && (
                <Table.ColumnHeader>
                  {texts.common.childrenTable.parent[language]}
                </Table.ColumnHeader>
              )}
              <Table.ColumnHeader>{texts.children.excuse.status[language]}</Table.ColumnHeader>
              {isParent && (
                <Table.ColumnHeader>{texts.common.actions[language]}</Table.ColumnHeader>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedChildren.map((child) => {
              const activeExcuse = getActiveExcuse(child.id);
              const childName = `${child.firstname} ${child.surname}`;
              return (
                <Table.Row key={child.id}>
                  <Table.Cell>
                    <Text>
                      {child.firstname} {child.surname}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{child.age}</Table.Cell>
                  {(isAdmin || isTeacher) && (
                    <Table.Cell>
                      <VStack align="start" gap={1}>
                        {child.parents.map((parent) => {
                          const fullName = `${parent.firstname} ${parent.surname}`;
                          return (
                            <Text key={`${child.id}-parent-name-${parent.id}`}>
                              {canViewParentProfile ? (
                                <ChakraLink asChild color={linkColor}>
                                  <RouterLink
                                    to={ROUTES.PROFILE_DETAIL.replace(':id', parent.id.toString())}
                                  >
                                    {fullName}
                                  </RouterLink>
                                </ChakraLink>
                              ) : (
                                fullName
                              )}
                            </Text>
                          );
                        })}
                      </VStack>
                    </Table.Cell>
                  )}
                  {activeExcuse ? (
                    <Table.Cell>
                      <Text fontSize="sm" color="orange.500">
                        {texts.children.excuse.status[language]} (
                        {formatExcuseDate(activeExcuse.date_from)}
                        {' - '}
                        {formatExcuseDate(activeExcuse.date_to)})
                      </Text>
                    </Table.Cell>
                  ) : (
                    <Table.Cell>
                      <Text fontSize="sm" color="text-muted">
                        -
                      </Text>
                    </Table.Cell>
                  )}
                  {isParent && (
                    <Table.Cell>
                      <ChildExcuseAction
                        childId={child.id}
                        childName={childName}
                        language={language}
                        excuse={activeExcuse}
                        onRefreshExcuses={onRefreshExcuses}
                        size="xs"
                        variant="outline"
                      />
                    </Table.Cell>
                  )}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
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
