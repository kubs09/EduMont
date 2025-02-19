import React, { useCallback } from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Button, useDisclosure } from '@chakra-ui/react';
import { PendingAdmissionUser } from '../../types/admission';
import { AppointmentReviewModal } from './AppointmentReviewModal';
import { texts } from '../../texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';

interface ParentsInProgressProps {
  parents: PendingAdmissionUser[];
  getStatusBadge: (status: string) => React.ReactElement;
  onReviewComplete?: () => void;
}

export const AdminParentsInProgressTable: React.FC<ParentsInProgressProps> = ({
  parents,
  getStatusBadge,
  onReviewComplete,
}) => {
  const { language } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedParent, setSelectedParent] = React.useState<PendingAdmissionUser | null>(null);

  const tableTexts = texts.adminAdmissions.table;

  const handleViewProgress = (parent: PendingAdmissionUser) => {
    setSelectedParent(parent);
    onOpen();
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleReviewComplete = useCallback(() => {
    // Force refresh of parent data
    onReviewComplete?.();
    setSelectedParent(null);
    onClose();
  }, [onReviewComplete, onClose]);

  return (
    <>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>{tableTexts.childName[language]}</Th>
            <Th>{tableTexts.childAge[language]}</Th>
            <Th>{tableTexts.parent[language]}</Th>
            <Th>{tableTexts.email[language]}</Th>
            <Th>{tableTexts.step[language]}</Th>
            <Th>{tableTexts.status[language]}</Th>
            <Th>{tableTexts.actions[language]}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {parents.map((parent) => (
            <Tr key={parent.id}>
              <Td>{`${parent.child_firstname} ${parent.child_surname}`}</Td>
              <Td>{calculateAge(parent.child_date_of_birth)}</Td>
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
                  {texts.adminAdmissions.statusBadges[
                    parent.current_step.status as keyof typeof texts.adminAdmissions.statusBadges
                  ][language] || tableTexts.reviewProgress[language]}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {selectedParent && (
        <AppointmentReviewModal
          isOpen={isOpen}
          onClose={onClose}
          parent={selectedParent}
          language={language}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </>
  );
};
