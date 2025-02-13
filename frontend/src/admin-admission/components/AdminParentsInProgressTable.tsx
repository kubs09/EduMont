import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Button, useDisclosure } from '@chakra-ui/react';
import { PendingAdmissionUser } from '../../services/api/admission';
import { AppointmentReviewModal } from './AppointmentReviewModal';

interface ParentsInProgressProps {
  parents: PendingAdmissionUser[];
  getStatusBadge: (status: string) => React.ReactElement;
  language: 'cs' | 'en'; // Update this to be more specific
  texts: {
    table: {
      parent: Record<'cs' | 'en', string>;
      email: Record<'cs' | 'en', string>;
      step: Record<'cs' | 'en', string>;
      status: Record<'cs' | 'en', string>;
      actions: Record<'cs' | 'en', string>;
      viewProgress?: Record<'cs' | 'en', string>;
    };
  };
  onReviewComplete?: () => void;
}

export const AdminParentsInProgressTable: React.FC<ParentsInProgressProps> = ({
  parents,
  getStatusBadge,
  language,
  texts,
  onReviewComplete,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedParent, setSelectedParent] = React.useState<PendingAdmissionUser | null>(null);

  const handleViewProgress = (parent: PendingAdmissionUser) => {
    setSelectedParent(parent);
    onOpen();
  };

  return (
    <>
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
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => handleViewProgress(parent)}
                  isDisabled={parent.current_step.status !== 'pending_review'}
                >
                  {texts.table.viewProgress?.[language] || 'View Progress'}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {selectedParent && (
        <AppointmentReviewModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedParent(null);
          }}
          parent={selectedParent}
          language={language}
          onReviewComplete={() => {
            onReviewComplete?.();
            onClose();
            setSelectedParent(null);
          }}
        />
      )}
    </>
  );
};
