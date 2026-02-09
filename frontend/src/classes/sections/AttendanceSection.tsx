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
  useToast,
  HStack,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Class } from '@frontend/types/class';
import { Combobox, DatePicker } from '@frontend/shared/components';
import {
  checkInChild,
  checkOutChild,
  ClassAttendanceRow,
  getClassAttendance,
} from '@frontend/services/api/class';

interface AttendanceTabProps {
  classData: Class;
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  currentUserId: number | null;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({
  classData,
  language,
  isAdmin,
  isTeacher,
  isParent,
  currentUserId,
}) => {
  const toast = useToast();
  const [rows, setRows] = useState<ClassAttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionChildId, setActionChildId] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [attendanceDate, setAttendanceDate] = useState(today);
  const effectiveDate = attendanceDate || today;
  const canManageAttendance = (isAdmin || isTeacher) && effectiveDate === today;

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

  const showActionColumn =
    effectiveDate === today &&
    (isAdmin || isTeacher || (isParent && getVisibleChildren().length > 0));

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
                    setRows((prevRows) => prevRows.filter((row) => row.id === childId));
                  } else {
                    setSelectedChildId(null);
                    loadAttendance();
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
                <Th>{texts.childrenTable.firstname[language]}</Th>
                <Th>{texts.childrenTable.surname[language]}</Th>
                <Th>{texts.classes.detail.checkIn[language]}</Th>
                <Th>{texts.classes.detail.checkOut[language]}</Th>
                {showActionColumn && <Th>{texts.classes.action[language]}</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => {
                const checkInText = row.check_in_at
                  ? formatTime(row.check_in_at)
                  : texts.classes.detail.notCheckedIn[language];
                const checkOutText = row.check_out_at
                  ? formatTime(row.check_out_at)
                  : texts.classes.detail.notCheckedOut[language];
                return (
                  <Tr key={row.id}>
                    <Td>{row.firstname}</Td>
                    <Td>{row.surname}</Td>
                    <Td>
                      <Text color={isLateCheckIn(row.check_in_at) ? 'red.500' : 'inherit'}>
                        {checkInText}
                      </Text>
                    </Td>
                    <Td>
                      <Text color={isLateCheckOut(row.check_out_at) ? 'red.500' : 'inherit'}>
                        {checkOutText}
                      </Text>
                    </Td>
                    {(canManageAttendance || canParentManageChild(row.id)) && (
                      <Td>
                        <HStack spacing={2}>
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
                      </Td>
                    )}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AttendanceTab;
