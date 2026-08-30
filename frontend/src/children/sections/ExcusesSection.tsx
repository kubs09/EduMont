import React, { useEffect, useMemo, useState } from 'react';
import { Table, Text, Link as ChakraLink, HStack, Box, Flex } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { ChildExcuse } from '@frontend/types/child';
import { ROUTES } from '@frontend/shared/route';
import { formatDate } from '@frontend/shared/components/DatePicker/utils/utils';
import { DatePicker } from '@frontend/shared/components';
import { TablePagination, DEFAULT_PAGE_SIZE } from '@frontend/shared/components/TablePagination';
import ChildExcuseAction from '@frontend/shared/components/ChildExcuseAction/ChildExcuseAction';

interface ExcusesSectionProps {
  childId: number;
  excuses: ChildExcuse[];
  language: 'cs' | 'en';
  isParent: boolean;
  canViewParentProfile: boolean;
  onRefreshExcuses: (childId: number) => Promise<void>;
}

const formatExcuseDate = (value: string, language: 'cs' | 'en') => {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return formatDate(direct, language);
  }
  const fallback = new Date(`${value}T00:00:00`);
  if (!Number.isNaN(fallback.getTime())) {
    return formatDate(fallback, language);
  }
  return value;
};

const parseExcuseDate = (value: string) => {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }
  const fallback = new Date(`${value}T00:00:00`);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }
  return null;
};

const ExcusesSection: React.FC<ExcusesSectionProps> = ({
  childId,
  excuses,
  language,
  isParent,
  canViewParentProfile,
  onRefreshExcuses,
}) => {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }, []);
  const currentUserId = useMemo(() => {
    const parsed = Number(localStorage.getItem('userId') || '0');
    return isNaN(parsed) ? 0 : parsed;
  }, []);
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const filteredExcuses = useMemo(() => {
    const selected = parseExcuseDate(attendanceDate);
    if (!selected) {
      return excuses;
    }
    const selectedTime = selected.setHours(0, 0, 0, 0);
    return excuses.filter((excuse) => {
      const from = parseExcuseDate(excuse.date_from);
      const to = parseExcuseDate(excuse.date_to);
      if (!from || !to) {
        return false;
      }
      const fromTime = from.setHours(0, 0, 0, 0);
      const toTime = to.setHours(0, 0, 0, 0);
      return selectedTime >= fromTime && selectedTime <= toTime;
    });
  }, [attendanceDate, excuses]);
  const totalPages = Math.max(1, Math.ceil(filteredExcuses.length / pageSize));
  const pagedExcuses = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredExcuses.slice(startIndex, startIndex + pageSize);
  }, [filteredExcuses, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [attendanceDate]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <Box w="full" overflowX="auto">
      {isParent && (
        <Flex align="center" mb={4} gap={2}>
          <ChildExcuseAction
            childId={childId}
            childName=""
            language={language}
            onRefreshExcuses={onRefreshExcuses}
            size="sm"
            variant="brand"
          />
        </Flex>
      )}
      <HStack gap={4} align="center" flexWrap="wrap" mb={4}>
        <Text variant="filter">{texts.classes.detail.attendanceDate[language]}:</Text>
        <DatePicker
          viewType="day"
          value={attendanceDate}
          onChange={(value) => setAttendanceDate(value || today)}
          language={language}
        />
      </HStack>
      {filteredExcuses.length === 0 ? (
        <Text variant="empty">{texts.children.excuse.historyEmpty[language]}</Text>
      ) : (
        <>
          <Table.Root variant="simple" size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{texts.children.excuse.dateFrom[language]}</Table.ColumnHeader>
                <Table.ColumnHeader>{texts.children.excuse.dateTo[language]}</Table.ColumnHeader>
                <Table.ColumnHeader>{texts.children.excuse.reason[language]}</Table.ColumnHeader>
                <Table.ColumnHeader>
                  {texts.children.excuse.submittedBy[language]}
                </Table.ColumnHeader>
                {isParent && (
                  <Table.ColumnHeader>{texts.children.excuse.actions[language]}</Table.ColumnHeader>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {pagedExcuses.map((excuse) => {
                const parentName = [excuse.parent_firstname, excuse.parent_surname]
                  .filter(Boolean)
                  .join(' ');
                const parentId = excuse.parent_id;
                const hasParentLink = canViewParentProfile && parentId;
                const isOwnExcuse = isParent && excuse.parent_id === currentUserId;
                return (
                  <Table.Row key={excuse.id}>
                    <Table.Cell>{formatExcuseDate(excuse.date_from, language)}</Table.Cell>
                    <Table.Cell>{formatExcuseDate(excuse.date_to, language)}</Table.Cell>
                    <Table.Cell>
                      <Text whiteSpace="pre-wrap">{excuse.reason || '-'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      {parentName ? (
                        hasParentLink ? (
                          <ChakraLink asChild color="fg-brand">
                            <RouterLink
                              to={ROUTES.PROFILE_DETAIL.replace(':id', parentId.toString())}
                            >
                              {parentName}
                            </RouterLink>
                          </ChakraLink>
                        ) : (
                          <Text>{parentName}</Text>
                        )
                      ) : (
                        <Text>-</Text>
                      )}
                    </Table.Cell>
                    {isParent && (
                      <Table.Cell>
                        {isOwnExcuse ? (
                          <HStack gap={2}>
                            <ChildExcuseAction
                              childId={childId}
                              childName=""
                              language={language}
                              excuse={excuse}
                              onRefreshExcuses={onRefreshExcuses}
                              size="xs"
                              variant="outline"
                              buttonText={texts.children.excuse.edit[language]}
                            />
                          </HStack>
                        ) : (
                          <Text>-</Text>
                        )}
                      </Table.Cell>
                    )}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            totalCount={filteredExcuses.length}
          />
        </>
      )}
    </Box>
  );
};

export default ExcusesSection;
