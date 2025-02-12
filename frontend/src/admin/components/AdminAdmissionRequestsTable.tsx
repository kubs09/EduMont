import React from 'react';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { AdmissionRequestDetails } from '../../services/api/admission';

interface AdmissionRequestProps {
  admissions: AdmissionRequestDetails[];
  onApprove: (admission: AdmissionRequestDetails) => void;
  onDeny: (admission: AdmissionRequestDetails) => void;
  calculateAge: (dob: string) => number;
  getStatusBadge: (status: string) => React.ReactElement;
  language: string;
  texts: {
    table: {
      name: Record<string, string>;
      parent: Record<string, string>;
      email: Record<string, string>;
      phone: Record<string, string>;
      date: Record<string, string>;
      age: Record<string, string>;
      status: Record<string, string>;
      actions: Record<string, string>;
    };
    approve: Record<string, string>;
    deny: Record<string, string>;
  };
}

export const AdminAdmissionRequestsTable: React.FC<AdmissionRequestProps> = ({
  admissions,
  onApprove,
  onDeny,
  calculateAge,
  getStatusBadge,
  language,
  texts,
}) => (
  <Table variant="simple">
    <Thead>
      <Tr>
        <Th>{texts.table.name[language]}</Th>
        <Th>{texts.table.parent[language]}</Th>
        <Th>{texts.table.email[language]}</Th>
        <Th>{texts.table.phone[language]}</Th>
        <Th>{texts.table.date[language]}</Th>
        <Th>{texts.table.age[language]}</Th>
        <Th>{texts.table.status[language]}</Th>
        <Th>{texts.table.actions[language]}</Th>
      </Tr>
    </Thead>
    <Tbody>
      {admissions
        .filter((admission) => ['pending', 'approved', 'invited'].includes(admission.status))
        .map((admission) => (
          <Tr key={admission.id}>
            <Td>{`${admission.child_firstname} ${admission.child_surname}`}</Td>
            <Td>{`${admission.firstname} ${admission.surname}`}</Td>
            <Td>{admission.email}</Td>
            <Td>{admission.phone}</Td>
            <Td>{new Date(admission.date_of_birth).toLocaleDateString()}</Td>
            <Td>{calculateAge(admission.date_of_birth)}</Td>
            <Td>{getStatusBadge(admission.status)}</Td>
            <Td>
              {admission.status === 'pending' && (
                <Box>
                  <Button size="sm" colorScheme="green" mr={2} onClick={() => onApprove(admission)}>
                    {texts.approve[language]}
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => onDeny(admission)}>
                    {texts.deny[language]}
                  </Button>
                </Box>
              )}
            </Td>
          </Tr>
        ))}
    </Tbody>
  </Table>
);
