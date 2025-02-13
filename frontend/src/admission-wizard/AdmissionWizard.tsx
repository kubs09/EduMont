import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InfoMeetingStep } from './InfoMeetingStep';
import { Box } from '@chakra-ui/react';
import { ROUTES } from '../shared/route';
import { admissionService } from '../services/api/admission';

export const AdmissionWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const admissionStatus = localStorage.getItem('admissionStatus');

  useEffect(() => {
    if (admissionStatus !== 'in_progress') {
      navigate(ROUTES.ADMISSION_WELCOME);
    }

    // Fetch current admission status to determine current step
    const fetchStatus = async () => {
      try {
        const status = await admissionService.getStatus();
        const completedSteps = status.steps.filter((step) => step.status === 'approved').length;
        setCurrentStep(completedSteps + 1);
      } catch (error) {
        console.error('Error fetching admission status:', error);
      }
    };

    fetchStatus();
  }, [admissionStatus, navigate]);

  if (admissionStatus !== 'in_progress') {
    return null;
  }

  return (
    <Box maxW="container.md" mx="auto">
      {currentStep === 1 && <InfoMeetingStep />}
      {/* Add more step components here */}
    </Box>
  );
};
