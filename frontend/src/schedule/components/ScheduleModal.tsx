import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  useToast,
  FormErrorMessage,
  HStack,
  Text,
} from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import { Schedule, CreateScheduleData, UpdateScheduleData } from '../../types/schedule';
import { Child } from '../../types/child';
import { DatePicker } from '../../shared/components/DatePicker';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: CreateScheduleData | UpdateScheduleData) => Promise<void>;
  schedule?: Schedule | null;
  childrenData: Child[];
  defaultChildId?: number;
  defaultDate?: string;
}

interface FormData {
  child_id: string;
  date: string;
  start_time: string;
  duration_hours: string;
  activity: string;
  notes: string;
}

interface FormErrors {
  child_id?: string;
  date?: string;
  start_time?: string;
  duration_hours?: string;
  activity?: string;
  notes?: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schedule,
  childrenData,
  defaultChildId,
  defaultDate,
}) => {
  const { language } = useLanguage();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    child_id: '',
    date: '',
    start_time: '',
    duration_hours: '1',
    activity: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        setFormData({
          child_id: schedule.child_id.toString(),
          date: schedule.date,
          start_time: schedule.start_time,
          duration_hours: schedule.duration_hours.toString(),
          activity: schedule.activity || '',
          notes: schedule.notes || '',
        });
      } else {
        setFormData({
          child_id: defaultChildId?.toString() || '',
          date: defaultDate || new Date().toISOString().split('T')[0],
          start_time: '',
          duration_hours: '1',
          activity: '',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, schedule, defaultChildId, defaultDate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.child_id) {
      newErrors.child_id = texts.schedule.validation.childRequired[language];
    }

    if (!formData.date) {
      newErrors.date = texts.schedule.validation.dateRequired[language];
    }

    if (!formData.start_time) {
      newErrors.start_time = texts.schedule.validation.startTimeRequired[language];
    }

    if (!formData.duration_hours) {
      newErrors.duration_hours = texts.schedule.validation.durationRequired[language];
    } else {
      const duration = parseInt(formData.duration_hours);
      if (isNaN(duration) || duration < 1 || duration > 3) {
        newErrors.duration_hours = texts.schedule.validation.durationRange[language];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const selectedChild = childrenData.find((child) => child.id === parseInt(formData.child_id));
      if (!selectedChild) {
        toast({
          title: 'Child not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsSubmitting(false);
        return;
      }

      const scheduleData = {
        child_id: parseInt(formData.child_id),
        class_id: selectedChild.class_id,
        date: formData.date,
        start_time: formData.start_time,
        duration_hours: parseInt(formData.duration_hours),
        activity: formData.activity || undefined,
        notes: formData.notes || undefined,
        ...(schedule && { id: schedule.id }),
      };

      await onSave(scheduleData as CreateScheduleData | UpdateScheduleData);

      toast({
        title: schedule
          ? texts.schedule.messages.updateSuccess[language]
          : texts.schedule.messages.createSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error: unknown) {
      let errorMessage = schedule
        ? texts.schedule.messages.updateError[language]
        : texts.schedule.messages.createError[language];

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 409) {
          errorMessage = texts.schedule.validation.timeConflict[language];
        }
      }

      toast({
        title: errorMessage,
        description:
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
              (error as { message?: string }).message
            : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {schedule ? texts.schedule.editEntry[language] : texts.schedule.addEntry[language]}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.child_id}>
              <FormLabel>{texts.schedule.child[language]}</FormLabel>
              <Select
                value={formData.child_id}
                onChange={(e) => handleChange('child_id', e.target.value)}
                placeholder={`Select ${texts.schedule.child[language].toLowerCase()}`}
              >
                {childrenData.map((child: Child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstname} {child.surname}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.child_id}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.date}>
              <FormLabel>{texts.schedule.date[language]}</FormLabel>
              <DatePicker
                viewType="day"
                value={formData.date}
                onChange={(value) => handleChange('date', value)}
                language={language}
              />
              <FormErrorMessage>{errors.date}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.start_time}>
              <FormLabel>{texts.schedule.startTime[language]}</FormLabel>
              <HStack spacing={2}>
                <Select
                  value={formData.start_time.split(':')[0] || ''}
                  onChange={(e) => {
                    const hours = e.target.value;
                    const minutes = formData.start_time.split(':')[1] || '00';
                    handleChange('start_time', `${hours}:${minutes}`);
                  }}
                  placeholder={texts.schedule.viewOptions.hour[language]}
                  maxW="120px"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </Select>
                <Text>:</Text>
                <Select
                  value={formData.start_time.split(':')[1] || ''}
                  onChange={(e) => {
                    const hours = formData.start_time.split(':')[0] || '00';
                    const minutes = e.target.value;
                    handleChange('start_time', `${hours}:${minutes}`);
                  }}
                  placeholder={texts.schedule.viewOptions.minutes[language]}
                  maxW="120px"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const minutes = (i * 5).toString().padStart(2, '0');
                    return (
                      <option key={minutes} value={minutes}>
                        {minutes}
                      </option>
                    );
                  })}
                </Select>
              </HStack>
              <FormErrorMessage>{errors.start_time}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.duration_hours}>
              <FormLabel>{texts.schedule.duration[language]}</FormLabel>
              <Select
                value={formData.duration_hours}
                onChange={(e) => handleChange('duration_hours', e.target.value)}
              >
                <option value="1">1 {texts.schedule.hour[language]}</option>
                <option value="2">2 {texts.schedule.hours[language]}</option>
                <option value="3">3 {texts.schedule.hours[language]}</option>
              </Select>
              <FormErrorMessage>{errors.duration_hours}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.activity}>
              <FormLabel>{texts.schedule.activity[language]}</FormLabel>
              <Input
                value={formData.activity}
                onChange={(e) => handleChange('activity', e.target.value)}
                placeholder={texts.schedule.placeholders.activity[language]}
              />
              <FormErrorMessage>{errors.activity}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.notes}>
              <FormLabel>{texts.schedule.notes[language]}</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={texts.schedule.placeholders.notes[language]}
                rows={3}
              />
              <FormErrorMessage>{errors.notes}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText={texts.common.save[language]}
          >
            {texts.common.save[language]}
          </Button>
          <Button onClick={onClose} isDisabled={isSubmitting}>
            {texts.common.cancel[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ScheduleModal;
