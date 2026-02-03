import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
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
    const acceptedChildren = classData.children.filter((child) => child.status === 'accepted');
    if (isAdmin || isTeacher) return acceptedChildren;
    if (isParent) {
      return acceptedChildren.filter((child) => child.parent_id === currentUserId);
    }
    return [];
  };

  return (
    <Card>
      <CardHeader>
        <Heading size={{ base: 'sm', md: 'md' }}>
          {isParent
            ? texts.classes.detail.myChildren[language]
            : texts.classes.detail.students[language]}
        </Heading>
      </CardHeader>
      <CardBody>
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
                  {(isAdmin || isTeacher) && <Td>{child.parent}</Td>}
                  {(isAdmin || isTeacher) && <Td>{child.parent_contact || child.parent_email}</Td>}
                  {(isAdmin || isTeacher) && (
                    <Td>{child.status === 'pending' && classData.name}</Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  );
};

export default StudentsTab;
