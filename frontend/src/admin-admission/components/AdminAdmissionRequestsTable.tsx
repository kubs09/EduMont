import React from 'react';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { AdmissionRequestProps } from '../../types/admission';

export const AdminAdmissionRequestsTable: React.FC<AdmissionRequestProps> = ({
  admissions,
  onApprove,
  onDeny,
  calculateAge,
  getStatusBadge,
  language,
  loadingApproval,
  loadingDenial,
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
                  <Button
                    size="sm"
                    colorScheme="green"
                    mr={2}
                    onClick={() => onApprove(admission)}
                    isLoading={loadingApproval === Number(admission.id)}
                  >
                    {texts.approve[language]}
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => onDeny(admission)}
                    isLoading={loadingDenial === Number(admission.id)}
                  >
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
