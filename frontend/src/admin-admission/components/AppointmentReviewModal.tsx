import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  Textarea,
  useToast,
  Spinner,
  Box,
} from '@chakra-ui/react';
import { texts } from '../../texts';
import { admissionService } from '../../services/api/admission';
import { PendingAdmissionUser } from '../../types/admission';

// Add interface for appointment details
interface AppointmentDetails {
  date: string;
  online: boolean;
  notes?: string;
}

interface AppointmentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: PendingAdmissionUser;
  language: 'cs' | 'en'; // Update this to be more specific
  onReviewComplete: () => void;
}

export const AppointmentReviewModal: React.FC<AppointmentReviewModalProps> = ({
  isOpen,
  onClose,
  parent,
  language,
  onReviewComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Change to get specific user's progress
        const status = await admissionService.getUserAdmissionProgress(parent.id);

        const firstStep = status.steps.find((step) => step.order_index === 1);

        if (firstStep?.appointment) {
          setAppointmentDetails({
            date: firstStep.appointment.date,
            online: firstStep.appointment.online,
            notes: firstStep.admin_notes || '',
          });

          if (firstStep.admin_notes) {
            setNotes(firstStep.admin_notes);
          }
        } else {
          console.log('No appointment found in first step:', firstStep); // Debug log
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        toast({
          title: 'Error',
          description: texts.adminAdmissions.appointmentReview.toast.error.fetchFailed[language],
          status: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, parent.id, toast, language]);

  const handleReview = async (approved: boolean) => {
    if (!notes.trim()) {
      toast({
        title: 'Error',
        description: texts.adminAdmissions.appointmentReview.toast.notesRequired[language],
        status: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      await admissionService.reviewAppointment(parent.id, {
        status: approved ? 'approved' : 'rejected',
        adminNotes: notes,
      });

      toast({
        title: 'Success',
        description: approved
          ? texts.adminAdmissions.appointmentReview.toast.approveSuccess[language]
          : texts.adminAdmissions.appointmentReview.toast.denySuccess[language],
        status: 'success',
      });
      onReviewComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: approved
          ? texts.adminAdmissions.appointmentReview.toast.error.approveFailed[language]
          : texts.adminAdmissions.appointmentReview.toast.error.denyFailed[language],
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.adminAdmissions.appointmentReview.title[language]}</ModalHeader>
        <ModalBody>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Spinner />
            </Box>
          ) : appointmentDetails ? (
            <VStack align="stretch" spacing={4}>
              <Text>
                <strong>{texts.adminAdmissions.appointmentReview.date[language]}:</strong>{' '}
                {new Date(appointmentDetails.date).toLocaleString()}
              </Text>
              <Text>
                <strong>{texts.adminAdmissions.appointmentReview.type[language]}:</strong>{' '}
                {appointmentDetails.online
                  ? texts.adminAdmissions.appointmentReview.online[language]
                  : texts.adminAdmissions.appointmentReview.inPerson[language]}
              </Text>
              <Textarea
                placeholder={texts.adminAdmissions.appointmentReview.notes[language]}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </VStack>
          ) : (
            <Text>No appointment details found</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={submitting}>
            {texts.common.cancel[language]}
          </Button>
          <Button
            colorScheme="green"
            mr={3}
            onClick={() => handleReview(true)}
            isDisabled={submitting || !appointmentDetails}
          >
            {texts.adminAdmissions.appointmentReview.confirm[language]}
          </Button>
          <Button
            colorScheme="red"
            onClick={() => handleReview(false)}
            isDisabled={submitting || !appointmentDetails}
          >
            {texts.adminAdmissions.appointmentReview.deny[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
