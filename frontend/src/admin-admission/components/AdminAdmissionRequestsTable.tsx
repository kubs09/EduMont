import React from 'react';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { AdminRequestsProps } from '../../types/admission';
import { texts } from '../../texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';

export const AdminAdmissionRequestsTable: React.FC<AdminRequestsProps> = ({
  admissions,
  onApprove,
  onDeny,
  calculateAge,
  getStatusBadge,
  loadingApproval,
  loadingDenial,
}) => {
  const { language } = useLanguage();
  const tableTexts = texts.adminAdmissions;

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>{tableTexts.table.name[language]}</Th>
          <Th>{tableTexts.table.parent[language]}</Th>
          <Th>{tableTexts.table.email[language]}</Th>
          <Th>{tableTexts.table.phone[language]}</Th>
          <Th>{tableTexts.table.date[language]}</Th>
          <Th>{tableTexts.table.age[language]}</Th>
          <Th>{tableTexts.table.status[language]}</Th>
          <Th>{tableTexts.table.actions[language]}</Th>
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
                      isLoading={loadingApproval === admission.id}
                    >
                      {tableTexts.approve[language]}
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => onDeny(admission)}
                      isLoading={loadingDenial === admission.id}
                    >
                      {tableTexts.deny[language]}
                    </Button>
                  </Box>
                )}
              </Td>
            </Tr>
          ))}
      </Tbody>
    </Table>
  );
};
