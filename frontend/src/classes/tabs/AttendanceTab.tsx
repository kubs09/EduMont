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

  const attendanceDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

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

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAdmin || isTeacher) {
        const data = await getClassAttendance(classData.id, { date: attendanceDate });
        setRows(data);
        return;
      }

      if (isParent) {
        const visibleChildren = getVisibleChildren();
        const responses = await Promise.all(
          visibleChildren.map((child) =>
            getClassAttendance(classData.id, { date: attendanceDate, childId: child.id })
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
    attendanceDate,
    classData.id,
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

  const handleCheckIn = async (childId: number) => {
    setActionChildId(childId);
    try {
      await checkInChild(classData.id, childId, attendanceDate);
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
      await checkOutChild(classData.id, childId, attendanceDate);
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
    <Box>
      <Text fontSize="sm" color="gray.600" mb={3}>
        {texts.classes.detail.attendanceDate[language]}: {attendanceDate}
      </Text>
      {isLoading ? (
        <Text color="gray.500" fontStyle="italic">
          {texts.classes.detail.attendanceLoading[language]}
        </Text>
      ) : (
        <TableContainer>
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th>{texts.childrenTable.firstname[language]}</Th>
                <Th>{texts.childrenTable.surname[language]}</Th>
                <Th>{texts.classes.detail.checkIn[language]}</Th>
                <Th>{texts.classes.detail.checkOut[language]}</Th>
                {(isAdmin || isTeacher) && <Th>{texts.classes.action[language]}</Th>}
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
                    <Td>{checkInText}</Td>
                    <Td>{checkOutText}</Td>
                    {(isAdmin || isTeacher) && (
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(row.id)}
                            isDisabled={!!row.check_in_at}
                            isLoading={actionChildId === row.id}
                          >
                            {texts.classes.detail.checkInAction[language]}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(row.id)}
                            isDisabled={!row.check_in_at || !!row.check_out_at}
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
