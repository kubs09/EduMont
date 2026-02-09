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

interface StudentsTabProps {
  classData: Class;
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
  isParent: boolean;
  currentUserId: number | null;
}

const StudentsTab: React.FC<StudentsTabProps> = ({
  classData,
  language,
  isAdmin,
  isTeacher,
  isParent,
  currentUserId,
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
                <Td>{child.firstname}</Td>
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
