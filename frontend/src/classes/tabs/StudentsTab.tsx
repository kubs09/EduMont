import React from 'react';
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
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { Class } from '@frontend/types/class';
import { ROUTES } from '@frontend/shared/route';

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
  const canViewParentProfile = isAdmin || isTeacher;
  const getVisibleChildren = () => {
    const allChildren = classData.children;
    if (isAdmin || isTeacher) return allChildren;
    if (isParent) {
      return allChildren.filter((child) =>
        child.parents.some((parent) => parent.id === currentUserId)
      );
    }
    return [];
  };

  const formatParentContacts = (parents: Class['children'][number]['parents']) =>
    parents.map((parent) => parent.phone || parent.email);

  return (
    <Box>
      <TableContainer>
        <Table variant="simple" size="md">
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
            {getVisibleChildren().map((child) => (
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
                                color="blue.600"
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
    </Box>
  );
};

export default StudentsTab;
