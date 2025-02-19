import React from 'react';
import { AppointmentReviewModal } from './AppointmentReviewModal';
import { DocumentReviewModal } from './DocumentReviewModal';
import { PendingAdmissionUser } from '@frontend/types/admission';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parent: PendingAdmissionUser;
  language: 'cs' | 'en';
  onReviewComplete?: () => void;
}

export const StepReviewModalRouter: React.FC<Props> = ({
  isOpen,
  onClose,
  parent,
  language,
  onReviewComplete,
}) => {
  // Create a guaranteed callback function
  const handleReviewComplete = () => {
    onReviewComplete?.();
  };

  // Route to the correct modal based on step_id
  switch (parent.current_step.step_id) {
    case 1: // Information Meeting
      return (
        <AppointmentReviewModal
          isOpen={isOpen}
          onClose={onClose}
          parent={parent}
          language={language}
          onReviewComplete={handleReviewComplete}
        />
      );
    case 2: // Document Upload
      return (
        <DocumentReviewModal
          isOpen={isOpen}
          onClose={onClose}
          userId={parent.id}
          stepId={parent.current_step.step_id}
          language={language}
          onReviewComplete={handleReviewComplete}
        />
      );
    default:
      return null;
  }
};
