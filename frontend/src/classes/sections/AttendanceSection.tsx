import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tooltip,
  useToast,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Class } from '@frontend/types/class';
import {
  Combobox,
  DatePicker,
  DEFAULT_PAGE_SIZE,
  TablePagination,
} from '@frontend/shared/components';
import {
  checkInChild,
  checkOutChild,
  ClassAttendanceRow,
  getClassAttendance,
} from '@frontend/services/api/class';
import { ChildExcuse } from '@frontend/services/api/child';

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
  const toast = useToast();
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
    } catch (error) {
      toast({
        title: texts.classes.detail.attendanceError[language],
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
    } catch (error) {
      toast({
        title: texts.classes.detail.checkInError[language],
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
    } catch (error) {
      toast({
        title: texts.classes.detail.checkOutError[language],
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
      <HStack spacing={4} mb={4} align="center" flexWrap="wrap">
        <Text color="gray.600">{texts.classes.detail.attendanceDate[language]}:</Text>
        <DatePicker
          viewType="day"
          value={attendanceDate}
          onChange={(value) => setAttendanceDate(value || today)}
          language={language}
        />
        {classData.children.length > 1 && (
          <>
            <Text color="gray.600">{texts.classes.student[language]}:</Text>
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
        <Text color="gray.500" fontStyle="italic">
          {texts.classes.detail.attendanceLoading[language]}
        </Text>
      ) : (
        <TableContainer w="full" maxW="100%" overflowX="auto">
          <Table variant="simple" size="md" minW="max-content">
            <Thead>
              <Tr>
                {showActionColumn && (
                  <Th display={{ base: 'table-cell', md: 'none' }}>
                    {texts.classes.action[language]}
                  </Th>
                )}
                <Th display={{ base: 'table-cell', md: 'none' }}>
                  {texts.classes.student[language]}
                </Th>
                <Th display={{ base: 'none', md: 'table-cell' }}>
                  {texts.childrenTable.name[language]}
                </Th>
                <Th display={{ base: 'none', md: 'table-cell' }}>
                  {texts.classes.detail.checkIn[language]}
                </Th>
                <Th display={{ base: 'none', md: 'table-cell' }}>
                  {texts.classes.detail.checkOut[language]}
                </Th>
                {showActionColumn && (
                  <Th display={{ base: 'none', md: 'table-cell' }}>
                    {texts.classes.action[language]}
                  </Th>
                )}
              </Tr>
            </Thead>
            <Tbody>
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
                const excuseMeta = [parentName, excuseDateRange].filter(Boolean).join(' · ');
                const excuseTooltip = excuseForDate ? (
                  <Box>
                    <Text fontWeight="semibold">{excuseForDate.reason}</Text>
                    {excuseMeta && (
                      <Text fontSize="xs" color="gray.600">
                        {excuseMeta}
                      </Text>
                    )}
                  </Box>
                ) : null;
                const renderExcuseStatus = (color: string) => (
                  <Tooltip label={excuseTooltip} hasArrow placement="top" openDelay={200}>
                    <Text color={color} fontSize="sm">
                      {texts.profile.children.excuse.status[language]}
                    </Text>
                  </Tooltip>
                );
                return (
                  <Tr key={row.id}>
                    {(canManageAttendance || canParentManageChild(row.id)) && (
                      <Td display={{ base: 'table-cell', md: 'none' }}>
                        {isExcused ? (
                          renderExcuseStatus(excusedColor)
                        ) : (
                          <HStack spacing={2} w="full" justifyContent="flex-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(row.id)}
                              isDisabled={!!row.check_in_at || !isCheckInWindowOpen}
                              isLoading={actionChildId === row.id}
                            >
                              {texts.classes.detail.checkInAction[language]}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(row.id)}
                              isDisabled={
                                !row.check_in_at || !!row.check_out_at || !isCheckOutWindowOpen
                              }
                              isLoading={actionChildId === row.id}
                            >
                              {texts.classes.detail.checkOutAction[language]}
                            </Button>
                          </HStack>
                        )}
                      </Td>
                    )}
                    <Td>
                      <HStack spacing={2} align="center" flexWrap="wrap">
                        <Text>
                          {row.firstname} {row.surname}
                        </Text>
                        {isExcused && renderExcuseStatus('orange.500')}
                      </HStack>
                    </Td>
                    <Td display={{ base: 'none', md: 'table-cell' }}>
                      <Text color={isLateCheckIn(row.check_in_at) ? 'red.500' : 'inherit'}>
                        {checkInText}
                      </Text>
                    </Td>
                    <Td display={{ base: 'none', md: 'table-cell' }}>
                      <Text color={isLateCheckOut(row.check_out_at) ? 'red.500' : 'inherit'}>
                        {checkOutText}
                      </Text>
                    </Td>
                    {(canManageAttendance || canParentManageChild(row.id)) && (
                      <Td display={{ base: 'none', md: 'table-cell' }}>
                        {isExcused ? (
                          renderExcuseStatus('orange.500')
                        ) : (
                          <HStack spacing={2} w="full" justifyContent="flex-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(row.id)}
                              isDisabled={!!row.check_in_at || !isCheckInWindowOpen}
                              isLoading={actionChildId === row.id}
                            >
                              {texts.classes.detail.checkInAction[language]}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(row.id)}
                              isDisabled={
                                !row.check_in_at || !!row.check_out_at || !isCheckOutWindowOpen
                              }
                              isLoading={actionChildId === row.id}
                            >
                              {texts.classes.detail.checkOutAction[language]}
                            </Button>
                          </HStack>
                        )}
                      </Td>
                    )}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
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
