import { useEffect, useState } from 'react';
import { InfoMeetingStep } from './InfoMeetingStep';
import { Box, Spinner } from '@chakra-ui/react';
import { admissionService, AdmissionStep } from '../services/api/admission';

export type StepStatus = 'select' | 'waiting' | 'completed' | 'pending_review' | 'rejected';
export type ApiStepStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'pending_review';

interface StepState {
  currentStatus: StepStatus;
  appointmentId: number | null;
}

export const AdmissionWizard = () => {
  const [steps, setSteps] = useState<AdmissionStep[]>([]);
  const [stepStates, setStepStates] = useState<Record<number, StepState>>({
    1: { currentStatus: 'select', appointmentId: null }, // Initialize with default state for step 1
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await admissionService.getStatus();
        setSteps(status.steps);

        // Initialize step states based on API response
        const newStepStates: Record<number, StepState> = {};
        status.steps.forEach((step) => {
          let currentStatus: StepStatus = 'select';

          // Map API status to frontend status
          switch (step.status) {
            case 'pending':
              currentStatus = 'select';
              break;
            case 'submitted':
              currentStatus = 'pending_review';
              break;
            case 'approved':
              currentStatus = 'completed';
              break;
            case 'rejected':
              currentStatus = 'rejected';
              break;
            // Add other status mappings as needed
          }

          newStepStates[step.step_id] = {
            currentStatus,
            appointmentId: step.appointment_id || null,
          };
        });

        setStepStates(newStepStates);
      } catch (error) {
        console.error('Error fetching admission status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Debug log for current state
  useEffect(() => {
    console.log('Current stepStates:', stepStates);
  }, [stepStates]);

  const updateStepState = (stepId: number, newState: Partial<StepState>) => {
    console.log('Updating step state:', stepId, newState); // Debug log
    setStepStates((prev) => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        ...newState,
      },
    }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  const currentStep = steps.find(
    (step) => step.status === 'pending' || step.status === 'rejected' || step.status === 'submitted'
  );

  if (!currentStep) {
    return null;
  }

  return (
    <Box maxW="container.md" mx="auto">
      {currentStep.step_id === 1 && (
        <InfoMeetingStep
          stepState={stepStates[1] || { currentStatus: 'select', appointmentId: null }}
          onUpdateState={(newState) => updateStepState(1, newState)}
        />
      )}
      {/* Add more step components here */}
    </Box>
  );
};
