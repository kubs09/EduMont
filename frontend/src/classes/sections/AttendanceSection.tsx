import React, { useCallback, useMemo, useState } from 'react';
import { useColorModeValue } from '../../shared/contexts/ColorContext';
import { Box, Button, Table, Text, HStack } from '@chakra-ui/react';
import { Tooltip } from '@frontend/shared/ui/tooltip';
import { texts } from '@frontend/texts';
import { Class, ClassAttendanceRow } from '@frontend/types/class';
import {
  Combobox,
  DatePicker,
  DEFAULT_PAGE_SIZE,
  TablePagination,
} from '@frontend/shared/components';
import { checkInChild, checkOutChild, getClassAttendance } from '@frontend/services/api/class';
import { ChildExcuse } from '@frontend/types/child';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

interface AttendanceTabProps {
  classData: Class;
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  currentUserId: number | null;
  excusesByChildId: Record<number, ChildExcuse[]>;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({
  classData,
  language,
  isAdmin,
  isTeacher,
  isParent,
  currentUserId,
  excusesByChildId,
}) => {
  const toast = useAppToast();
  const [rows, setRows] = useState<ClassAttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionChildId, setActionChildId] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [attendanceDate, setAttendanceDate] = useState(today);
  const effectiveDate = attendanceDate || today;
  const canManageAttendance = (isAdmin || isTeacher) && effectiveDate === today;
  const excusedColor = useColorModeValue('orange.100', 'orange.300');
  const tooltipBg = useColorModeValue('gray.50', 'gray.800');
  const tooltipTextColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const tooltipBorderColor = useColorModeValue('gray.200', 'gray.700');

  const getVisibleChildren = useCallback(() => {
    const allChildren = classData.children;
    if (isAdmin || isTeacher) return allChildren;
    if (isParent) {
      if (!allChildren.length) return [];
      const hasParentInfo = allChildren.some((child) => Array.isArray(child.parents));
      if (!hasParentInfo) return allChildren;
      return allChildren.filter((child) =>
        child.parents?.some((parent) => parent.id === currentUserId)
      );
    }
    return [];
  }, [classData.children, currentUserId, isAdmin, isParent, isTeacher]);

  const canParentManageChild = useCallback(
    (childId: number) => {
      if (!isParent || effectiveDate !== today) return false;
      const child = classData.children.find((item) => item.id === childId);
      if (!child || !Array.isArray(child.parents)) return false;
      return child.parents.some((parent) => parent.id === currentUserId);
    },
    [classData.children, currentUserId, effectiveDate, isParent, today]
  );

  const formatExcuseDate = (value: string) => {
    const locale = language === 'cs' ? 'cs-CZ' : 'en-US';
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct.toLocaleDateString(locale);
    const fallback = new Date(`${value}T00:00:00`);
    return Number.isNaN(fallback.getTime()) ? value : fallback.toLocaleDateString(locale);
  };

  const getExcuseForDate = useCallback(
    (childId: number, dateValue: string) => {
      const excuses = excusesByChildId[childId] || [];
      if (!excuses.length) return null;

      const target = new Date(dateValue);
      const targetDate = Number.isNaN(target.getTime())
        ? new Date(`${dateValue}T00:00:00`)
        : target;
      if (Number.isNaN(targetDate.getTime())) return null;
      const compareDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );

      const parseDate = (value: string) => {
        const direct = new Date(value);
        if (!Number.isNaN(direct.getTime())) return direct;
        const fallback = new Date(`${value}T00:00:00`);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
      };

      return (
        excuses.find((excuse) => {
          const fromDate = parseDate(excuse.date_from);
          const toDate = parseDate(excuse.date_to);
          if (!fromDate || !toDate) return false;
          return compareDate >= fromDate && compareDate <= toDate;
        }) || null
      );
    },
    [excusesByChildId]
  );

  const showActionColumn =
    effectiveDate === today &&
    (isAdmin || isTeacher || (isParent && getVisibleChildren().length > 0));

  const filteredRows = useMemo(() => {
    if (!selectedChildId) return rows;
    return rows.filter((row) => row.id === selectedChildId);
  }, [rows, selectedChildId]);

  const totalPages = Math.ceil(filteredRows.length / DEFAULT_PAGE_SIZE);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const paginatedRows = filteredRows.slice(
    (safeCurrentPage - 1) * DEFAULT_PAGE_SIZE,
    safeCurrentPage * DEFAULT_PAGE_SIZE
  );

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAdmin || isTeacher) {
        const data = await getClassAttendance(classData.id, { date: effectiveDate });
        setRows(data);
        return;
      }

      if (isParent) {
        const visibleChildren = getVisibleChildren();
        const responses = await Promise.all(
          visibleChildren.map((child) =>
            getClassAttendance(classData.id, { date: effectiveDate, childId: child.id })
          )
        );
        const combined = responses.flat();
        const uniqueByChild = new Map<number, ClassAttendanceRow>();
        combined.forEach((row) => {
          if (!uniqueByChild.has(row.id)) {
            uniqueByChild.set(row.id, row);
          }
        });
        const merged = Array.from(uniqueByChild.values()).sort((a, b) => {
          const surnameCompare = a.surname.localeCompare(b.surname);
          return surnameCompare !== 0 ? surnameCompare : a.firstname.localeCompare(b.firstname);
        });
        setRows(merged);
        return;
      }

      setRows([]);
    } catch {
      toast({
        title: texts.classes.errors.attendanceFetchFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    classData.id,
    effectiveDate,
    getVisibleChildren,
    isAdmin,
    isParent,
    isTeacher,
    language,
    toast,
  ]);

  React.useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  React.useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [attendanceDate, selectedChildId]);

  const formatTime = (value: string | null) => {
    if (!value) return '';
    const locale = language === 'cs' ? 'cs-CZ' : 'en-US';
    return new Date(value).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const isLateCheckIn = (value: string | null) => {
    if (!value) return false;
    const time = new Date(value);
    const minutes = time.getHours() * 60 + time.getMinutes();
    return minutes > 7 * 60;
  };

  const isLateCheckOut = (value: string | null) => {
    if (!value) return false;
    const time = new Date(value);
    const minutes = time.getHours() * 60 + time.getMinutes();
    return minutes > 16 * 60;
  };

  const isWithinTimeWindow = (startHour: number, endHour: number) => {
    const now = new Date();
    const hours = now.getHours();
    return hours >= startHour && hours <= endHour;
  };

  const isCheckInWindowOpen = isWithinTimeWindow(6, 8);
  const isCheckOutWindowOpen = isWithinTimeWindow(15, 17);

  const handleCheckIn = async (childId: number) => {
    setActionChildId(childId);
    try {
      await checkInChild(classData.id, childId, effectiveDate);
      await loadAttendance();
    } catch {
      toast({
        title: texts.classes.errors.checkInFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionChildId(null);
    }
  };

  const handleCheckOut = async (childId: number) => {
    setActionChildId(childId);
    try {
      await checkOutChild(classData.id, childId, effectiveDate);
      await loadAttendance();
    } catch {
      toast({
        title: texts.classes.errors.checkOutFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionChildId(null);
    }
  };

  return (
    <Box w="full" overflowX="auto">
      <HStack gap={4} mb={4} align="center" flexWrap="wrap">
        <Text variant="filter">{texts.classes.detail.attendanceDate[language]}:</Text>
        <DatePicker
          viewType="day"
          value={attendanceDate}
          onChange={(value) => setAttendanceDate(value || today)}
          language={language}
        />
        {classData.children.length > 1 && (
          <>
            <Text variant="filter">{texts.classes.student[language]}:</Text>
            <Box w={{ base: '100%', sm: '220px' }} maxW="220px">
              <Combobox
                options={classData.children.map((child) => ({
                  label: `${child.firstname} ${child.surname}`,
                  value: child.id,
                }))}
                placeholder={texts.classes.detail.filterByChild[language]}
                onChange={(value: string | number | null) => {
                  if (value) {
                    const childId = Number(value);
                    setSelectedChildId(childId);
                  } else {
                    setSelectedChildId(null);
                  }
                }}
                isClearable
                value={selectedChildId}
              />
            </Box>
          </>
        )}
      </HStack>
      {isLoading ? (
        <Text variant="filter" fontStyle="italic">
          {texts.classes.detail.attendanceLoading[language]}
        </Text>
      ) : (
        <Table.ScrollArea w="full" maxW="100%" overflowX="auto">
          <Table.Root variant="simple" size="md" minW="max-content">
            <Table.Header>
              <Table.Row>
                {showActionColumn && (
                  <Table.ColumnHeader display={{ base: 'table-cell', md: 'none' }}>
                    {texts.common.actions[language]}
                  </Table.ColumnHeader>
                )}
                <Table.ColumnHeader display={{ base: 'table-cell', md: 'none' }}>
                  {texts.classes.student[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>
                  {texts.common.childrenTable.name[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>
                  {texts.classes.detail.checkIn[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>
                  {texts.classes.detail.checkOut[language]}
                </Table.ColumnHeader>
                {showActionColumn && (
                  <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>
                    {texts.common.actions[language]}
                  </Table.ColumnHeader>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginatedRows.map((row) => {
                const checkInText = row.check_in_at
                  ? formatTime(row.check_in_at)
                  : texts.classes.detail.notCheckedIn[language];
                const checkOutText = row.check_out_at
                  ? formatTime(row.check_out_at)
                  : texts.classes.detail.notCheckedOut[language];
                const excuseForDate = getExcuseForDate(row.id, effectiveDate);
                const isExcused = !!excuseForDate;
                const parentName = excuseForDate
                  ? [excuseForDate.parent_firstname, excuseForDate.parent_surname]
                      .filter(Boolean)
                      .join(' ')
                  : '';
                const excuseDateRange = excuseForDate
                  ? `${formatExcuseDate(excuseForDate.date_from)} - ${formatExcuseDate(
                      excuseForDate.date_to
                    )}`
                  : '';
                const excuseTooltip = excuseForDate ? (
                  <Box>
                    <Text fontWeight="semibold">
                      {texts.children.excuse.reason[language]}: {excuseForDate.reason}
                    </Text>
                    <Text fontSize="xs" color={tooltipTextColor} opacity={0.85}>
                      {texts.children.excuse.dateRange[language]}: {excuseDateRange || '-'}
                    </Text>
                    <Text fontSize="xs" color={tooltipTextColor} opacity={0.85}>
                      {texts.children.excuse.submittedBy[language]}: {parentName || '-'}
                    </Text>
                  </Box>
                ) : null;
                const renderExcuseStatus = (color: string) => (
                  <Tooltip
                    content={excuseTooltip}
                    showArrow
                    openDelay={200}
                    contentProps={{
                      bg: tooltipBg,
                      color: tooltipTextColor,
                      borderWidth: '1px',
                      borderColor: tooltipBorderColor,
                    }}
                    positioning={{
                      placement: 'top',
                    }}
                  >
                    <Text color={color} fontSize="sm">
                      {texts.children.excuse.status[language]}
                    </Text>
                  </Tooltip>
                );
                return (
                  <Table.Row key={row.id}>
                    {(canManageAttendance || canParentManageChild(row.id)) && (
                      <Table.Cell display={{ base: 'table-cell', md: 'none' }}>
                        {isExcused ? (
                          renderExcuseStatus(excusedColor)
                        ) : (
                          <HStack gap={2} w="full" justifyContent="flex-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(row.id)}
                              disabled={!!row.check_in_at || !isCheckInWindowOpen}
                              loading={actionChildId === row.id}
                            >
                              {texts.classes.detail.checkIn[language]}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(row.id)}
                              disabled={
                                !row.check_in_at || !!row.check_out_at || !isCheckOutWindowOpen
                              }
                              loading={actionChildId === row.id}
                            >
                              {texts.classes.detail.checkOut[language]}
                            </Button>
                          </HStack>
                        )}
                      </Table.Cell>
                    )}
                    <Table.Cell>
                      <HStack gap={2} align="center" flexWrap="wrap">
                        <Text>
                          {row.firstname} {row.surname}
                        </Text>
                        {isExcused && renderExcuseStatus('orange.500')}
                      </HStack>
                    </Table.Cell>
                    <Table.Cell display={{ base: 'none', md: 'table-cell' }}>
                      <Text color={isLateCheckIn(row.check_in_at) ? 'red.500' : 'inherit'}>
                        {checkInText}
                      </Text>
                    </Table.Cell>
                    <Table.Cell display={{ base: 'none', md: 'table-cell' }}>
                      <Text color={isLateCheckOut(row.check_out_at) ? 'red.500' : 'inherit'}>
                        {checkOutText}
                      </Text>
                    </Table.Cell>
                    {(canManageAttendance || canParentManageChild(row.id)) && (
                      <Table.Cell display={{ base: 'none', md: 'table-cell' }}>
                        {isExcused ? (
                          renderExcuseStatus('orange.500')
                        ) : (
                          <HStack gap={2} w="full" justifyContent="flex-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(row.id)}
                              disabled={!!row.check_in_at || !isCheckInWindowOpen}
                              loading={actionChildId === row.id}
                            >
                              {texts.classes.detail.checkIn[language]}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(row.id)}
                              disabled={
                                !row.check_in_at || !!row.check_out_at || !isCheckOutWindowOpen
                              }
                              loading={actionChildId === row.id}
                            >
                              {texts.classes.detail.checkOut[language]}
                            </Button>
                          </HStack>
                        )}
                      </Table.Cell>
                    )}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}
      {!isLoading && filteredRows.length > 0 && (
        <TablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={DEFAULT_PAGE_SIZE}
          totalCount={filteredRows.length}
        />
      )}
    </Box>
  );
};

export default AttendanceTab;
