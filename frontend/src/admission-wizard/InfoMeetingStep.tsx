import {
  Box,
  Button,
  Card,
  Flex,
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
} from '@chakra-ui/react';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { admissionService } from '@frontend/services/api/admission';

interface Appointment {
  id: number;
  date: string;
  online: boolean;
  available_spots: number;
}

export const InfoMeetingStep = () => {
  const { language } = useLanguage();
  const toast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [preferredOnline, setPreferredOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/admission/appointments', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAppointment || preferredOnline === null) return;

    setIsLoading(true);
    try {
      await admissionService.scheduleAppointment(selectedAppointment, preferredOnline);
      setIsCompleted(true);
      // Remove next steps navigation - let admin review first
    } catch (error) {
      toast({
        title: texts.admissionSteps.infoMeeting.error[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'PPPP p', {
      locale: language === 'cs' ? cs : enUS,
    });
  };

  if (isCompleted) {
    return (
      <Box maxW="container.md" mx="auto" py={8}>
        <Alert
          status="success"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            {texts.admissionSteps.infoMeeting.successTitle[language]}
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {texts.admissionSteps.infoMeeting.successMessage[language]}
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

        <RadioGroup onChange={(value) => setPreferredOnline(value === 'online')}>
          <Text mb={4}>{texts.admissionSteps.infoMeeting.preferenceLabel[language]}</Text>
          <Stack direction="row" spacing={4}>
            <Radio value="online">{texts.admissionSteps.infoMeeting.online[language]}</Radio>
            <Radio value="inPerson">{texts.admissionSteps.infoMeeting.inPerson[language]}</Radio>
          </Stack>
        </RadioGroup>

        <Stack spacing={4}>
          {appointments.length === 0 ? (
            <Text>{texts.admissionSteps.infoMeeting.noAppointments[language]}</Text>
          ) : (
            appointments.map((appointment) => (
              <Card
                key={appointment.id}
                p={4}
                cursor="pointer"
                onClick={() => setSelectedAppointment(appointment.id)}
                bg={selectedAppointment === appointment.id ? 'brand.primary.50' : 'white'}
                borderColor={
                  selectedAppointment === appointment.id ? 'brand.primary.500' : 'gray.200'
                }
                borderWidth={1}
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="bold">{formatDate(appointment.date)}</Text>
                    <Text>
                      {appointment.online
                        ? texts.admissionSteps.infoMeeting.online[language]
                        : texts.admissionSteps.infoMeeting.inPerson[language]}
                    </Text>
                  </Box>
                  <Text>
                    {texts.admissionSteps.infoMeeting.availableSpots[language]}{' '}
                    {appointment.available_spots}
                  </Text>
                </Flex>
              </Card>
            ))
          )}
        </Stack>

        <Button
          colorScheme="brand"
          isDisabled={!selectedAppointment || preferredOnline === null}
          onClick={handleSubmit}
          isLoading={isLoading}
        >
          {texts.admissionSteps.infoMeeting.submitButton[language]}
        </Button>
      </VStack>
    </Box>
  );
};
