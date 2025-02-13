import {
  Box,
  Button,
  Heading,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useToast,
  VStack,
  Alert,
  AlertTitle,
  AlertDescription,
  Spinner,
} from '@chakra-ui/react';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';
import { useEffect, useState } from 'react';
import { admissionService, InfoMeeting } from '@frontend/services/api/admission';
import { format } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { StepStatus } from './AdmissionWizard';

interface StepState {
  currentStatus: StepStatus;
  appointmentId: number | null;
}

interface InfoMeetingStepProps {
  stepState: StepState;
  onUpdateState: (newState: Partial<StepState>) => void;
}

export const InfoMeetingStep = ({ stepState, onUpdateState }: InfoMeetingStepProps) => {
  const { language } = useLanguage();
  const toast = useToast();
  const [meetings, setMeetings] = useState<InfoMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadMeetings = async () => {
      if (stepState.currentStatus !== 'select') return;

      try {
        const data = await admissionService.getTerms();
        setMeetings(data);
      } catch (error) {
        console.error('Error fetching meetings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load meeting times',
          status: 'error',
          duration: 5000,
        });
      }
    };

    loadMeetings();
  }, [stepState.currentStatus, toast]);

  const formatMeetingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'PPpp', {
      locale: language === 'cs' ? cs : enUS,
    });
  };

  const handleSubmit = async () => {
    if (!stepState.appointmentId) return;

    setIsLoading(true);
    try {
      await admissionService.scheduleAppointment(stepState.appointmentId, true);
      onUpdateState({ currentStatus: 'waiting' });
    } catch (error) {
      console.error('Meeting scheduling error:', error);
      toast({
        title: texts.admissionSteps.infoMeeting.error[language],
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (stepState.currentStatus === 'waiting') {
    return (
      <Box maxW="container.md" mx="auto" py={8}>
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <Spinner size="xl" color="brand.primary.500" mb={4} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            {texts.admissionSteps.infoMeeting.waitingTitle[language]}
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {texts.admissionSteps.infoMeeting.waitingMessage[language]}
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxW="container.md" mx="auto" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg" color="brand.primary.800">
          {texts.admissionSteps.infoMeeting.title[language]}
        </Heading>
        <Text>{texts.admissionSteps.infoMeeting.description[language]}</Text>

        <RadioGroup
          onChange={(value) => onUpdateState({ appointmentId: Number(value) })}
          value={stepState.appointmentId?.toString() || ''}
        >
          <Text mb={4}>{texts.admissionSteps.infoMeeting.termLabel[language]}</Text>
          <Stack spacing={4}>
            {meetings.map((meeting) => (
              <Radio key={meeting.id} value={meeting.id.toString()}>
                <Stack>
                  <Text fontWeight="bold">{formatMeetingDate(meeting.date)}</Text>
                  <Text fontSize="sm">
                    {meeting.online
                      ? texts.admissionSteps.infoMeeting.online[language]
                      : texts.admissionSteps.infoMeeting.inPerson[language]}
                    {' • '}
                    {texts.admissionSteps.infoMeeting.availableSpots[language]}{' '}
                    {meeting.available_spots}
                  </Text>
                </Stack>
              </Radio>
            ))}
          </Stack>
        </RadioGroup>

        <Button
          bg="brand"
          isDisabled={!stepState.appointmentId}
          onClick={handleSubmit}
          isLoading={isLoading}
        >
          {texts.admissionSteps.infoMeeting.submitButton[language]}
        </Button>
      </VStack>
    </Box>
  );
};
