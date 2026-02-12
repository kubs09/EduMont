import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Link as ChakraLink,
  HStack,
  Box,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { ChildExcuse } from '@frontend/services/api';
import { ROUTES } from '@frontend/shared/route';
import { formatDate } from '@frontend/shared/components/DatePicker/utils/utils';
import { DatePicker } from '@frontend/shared/components';
import { TablePagination, DEFAULT_PAGE_SIZE } from '@frontend/shared/components/TablePagination';

interface ExcusesSectionProps {
  excuses: ChildExcuse[];
  language: 'cs' | 'en';
  canViewParentProfile: boolean;
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
  excuses,
  language,
  canViewParentProfile,
}) => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
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
      <HStack spacing={4} mb={4} align="center" flexWrap="wrap">
        <Text variant="filter">{texts.classes.detail.attendanceDate[language]}:</Text>
        <DatePicker
          viewType="day"
          value={attendanceDate}
          onChange={(value) => setAttendanceDate(value || today)}
          language={language}
        />
      </HStack>
      {filteredExcuses.length === 0 ? (
        <Text variant="empty">{texts.profile.children.excuse.historyEmpty[language]}</Text>
      ) : (
        <>
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th>{texts.profile.children.excuse.dateFrom[language]}</Th>
                <Th>{texts.profile.children.excuse.dateTo[language]}</Th>
                <Th>{texts.profile.children.excuse.reason[language]}</Th>
                <Th>{texts.profile.children.excuse.submittedBy[language]}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pagedExcuses.map((excuse) => {
                const parentName = [excuse.parent_firstname, excuse.parent_surname]
                  .filter(Boolean)
                  .join(' ');
                const parentId = excuse.parent_id;
                const hasParentLink = canViewParentProfile && parentId;
                return (
                  <Tr key={excuse.id}>
                    <Td>{formatExcuseDate(excuse.date_from, language)}</Td>
                    <Td>{formatExcuseDate(excuse.date_to, language)}</Td>
                    <Td>
                      <Text whiteSpace="pre-wrap">{excuse.reason || '-'}</Text>
                    </Td>
                    <Td>
                      {parentName ? (
                        hasParentLink ? (
                          <ChakraLink
                            as={RouterLink}
                            to={ROUTES.PROFILE_DETAIL.replace(':id', parentId.toString())}
                            color="blue.500"
                          >
                            {parentName}
                          </ChakraLink>
                        ) : (
                          <Text>{parentName}</Text>
                        )
                      ) : (
                        <Text>-</Text>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
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
