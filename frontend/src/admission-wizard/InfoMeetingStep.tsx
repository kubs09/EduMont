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
  AlertIcon,
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

export const InfoMeetingStep = () => {
  const { language } = useLanguage();
  const toast = useToast();
  const [meetings, setMeetings] = useState<InfoMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'waiting' | 'completed'>('select');

  useEffect(() => {
    const checkExistingMeeting = async () => {
      try {
        // First check admission status from API
        const status = await admissionService.getStatus();
        const infoMeetingStep = status.steps.find((step) => step.step_id === 1); // Assuming info meeting is step 1

        if (infoMeetingStep?.status === 'submitted' || infoMeetingStep?.status === 'approved') {
          setSelectedMeeting(infoMeetingStep.appointment_id || null);
          setCurrentStep('waiting');
          return;
        }

        // If no meeting found in API, check localStorage as fallback
        const storedMeetingId = localStorage.getItem('selectedMeetingId');
        if (storedMeetingId) {
          setSelectedMeeting(Number(storedMeetingId));
          setCurrentStep('waiting');
          return;
        }

        // If no existing meeting, load available meetings
        const data = await admissionService.getTerms();
        setMeetings(data);
      } catch (error) {
        console.error('Error checking meeting status:', error);
        toast({
          title: 'Error',
          description: 'Failed to check meeting status',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    checkExistingMeeting();
  }, [toast]);

  const formatMeetingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'PPpp', {
      locale: language === 'cs' ? cs : enUS,
    });
  };

  const handleSubmit = async () => {
    if (!selectedMeeting) return;

    setIsLoading(true);
    try {
      await admissionService.scheduleAppointment(selectedMeeting, true);
      localStorage.setItem('selectedMeetingId', selectedMeeting.toString());
      setCurrentStep('waiting');
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

  // If currentStep is waiting, always show waiting screen
  if (currentStep === 'waiting') {
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
          onChange={(value) => setSelectedMeeting(Number(value))}
          value={selectedMeeting?.toString() || ''}
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
          isDisabled={!selectedMeeting}
          onClick={handleSubmit}
          isLoading={isLoading}
        >
          {texts.admissionSteps.infoMeeting.submitButton[language]}
        </Button>
      </VStack>
    </Box>
  );
};
