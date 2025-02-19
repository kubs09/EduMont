import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  useToast,
  Text,
} from '@chakra-ui/react';
import { admissionService } from '@frontend/services/api/admission';
import { texts } from '@frontend/texts';
import { PendingAdmissionUser } from '@frontend/types/admission';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parent: PendingAdmissionUser;
  language: 'cs' | 'en';
  onReviewComplete: () => void;
}

export const AppointmentReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  parent,
  language,
  onReviewComplete,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const t = texts.adminAdmissions.appointmentReview;

  const handleReview = async (approved: boolean) => {
    if (!notes.trim()) {
      toast({
        title: t.toast.notesRequired[language],
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await admissionService.reviewAppointment(parent.id, {
        status: approved ? 'approved' : 'rejected',
        adminNotes: notes,
      });

      // Update parent's current_step with the response data
      if (response.steps) {
        parent.current_step = {
          ...parent.current_step,
          status: response.steps[1].status, // Get the second step's status (Documentation)
        };
      }

      toast({
        title: approved ? t.toast.approveSuccess[language] : t.toast.denySuccess[language],
        status: 'success',
        duration: 3000,
      });

      onReviewComplete();
      onClose();
    } catch (error) {
      toast({
        title: approved
          ? t.toast.error.approveFailed[language]
          : t.toast.error.denyFailed[language],
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t.title[language]}</ModalHeader>
        <ModalBody>
          <Text mb={4} fontWeight="bold">
            {parent.firstname} {parent.surname}
          </Text>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notes[language]}
            mb={4}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="green"
            mr={3}
            onClick={() => handleReview(true)}
            isLoading={isSubmitting}
          >
            {t.confirm[language]}
          </Button>
          <Button colorScheme="red" onClick={() => handleReview(false)} isLoading={isSubmitting}>
            {t.deny[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
