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
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { NextActivity } from '@frontend/services/api/class';
import { Class } from '@frontend/types/class';

interface ActivitiesTabProps {
  classData: Class;
  nextActivities: NextActivity[];
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
}

const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  classData,
  nextActivities,
  language,
  isAdmin,
  isTeacher,
}) => {
  const getFilteredActivities = () => {
    return nextActivities.filter((activity) => {
      const child = classData.children.find((c) => c.id === activity.child_id);
      return child && child.status === 'accepted';
    });
  };

  return (
    <Card>
      <CardHeader>
        <Heading size={{ base: 'sm', md: 'md' }}>
          {texts.classes.detail.nextActivities[language]}
        </Heading>
      </CardHeader>
      <CardBody>
        {getFilteredActivities().length === 0 ? (
          <Text color="gray.500" fontStyle="italic">
            {texts.classes.detail.noNextActivities[language]}
          </Text>
        ) : (
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead>
                <Tr>
                  <Th>{texts.childrenTable.firstname[language]}</Th>
                  <Th>{texts.childrenTable.surname[language]}</Th>
                  <Th>{texts.classes.detail.activity[language]}</Th>
                  {(isAdmin || isTeacher) && <Th>{texts.classes.detail.notes[language]}</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {getFilteredActivities().map((activity) => (
                  <Tr key={`${activity.child_id}-${activity.id}`}>
                    <Td>{activity.firstname}</Td>
                    <Td>{activity.surname}</Td>
                    <Td>{activity.activity || '-'}</Td>
                    {(isAdmin || isTeacher) && <Td>{activity.notes || '-'}</Td>}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </CardBody>
    </Card>
  );
};

export default ActivitiesTab;
