import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Button } from '@chakra-ui/react';
import { PendingAdmissionUser } from '../../services/api/admission';

interface ParentsInProgressProps {
  parents: PendingAdmissionUser[];
  getStatusBadge: (status: string) => React.ReactElement;
  language: string;
  texts: {
    table: {
      parent: Record<string, string>;
      email: Record<string, string>;
      step: Record<string, string>;
      status: Record<string, string>;
      actions: Record<string, string>;
      viewProgress?: Record<string, string>;
    };
  };
}

export const AdminParentsInProgressTable: React.FC<ParentsInProgressProps> = ({
  parents,
  getStatusBadge,
  language,
  texts,
}) => (
  <Table variant="simple">
    <Thead>
      <Tr>
        <Th>{texts.table.parent[language]}</Th>
        <Th>{texts.table.email[language]}</Th>
        <Th>{texts.table.step[language]}</Th>
        <Th>{texts.table.status[language]}</Th>
        <Th>{texts.table.actions[language]}</Th>
      </Tr>
    </Thead>
    <Tbody>
      {parents.map((parent) => (
        <Tr key={parent.id}>
          <Td>{`${parent.firstname} ${parent.surname}`}</Td>
          <Td>{parent.email}</Td>
          <Td>{parent.current_step.name}</Td>
          <Td>{getStatusBadge(parent.current_step.status)}</Td>
          <Td>
            <Button size="sm" colorScheme="blue">
              {texts.table.viewProgress?.[language] || 'View Progress'}
            </Button>
          </Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);
