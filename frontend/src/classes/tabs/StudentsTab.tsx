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
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Class } from '@frontend/types/class';

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

  const formatParentNames = (parents: Class['children'][number]['parents']) =>
    parents.map((parent) => `${parent.firstname} ${parent.surname}`);

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
                      {formatParentNames(child.parents).map((name, parentIndex) => (
                        <Text key={`${child.id}-parent-name-${parentIndex}`}>{name}</Text>
                      ))}
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
