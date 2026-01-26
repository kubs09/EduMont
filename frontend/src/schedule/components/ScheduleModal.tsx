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
} from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import { Schedule, CreateScheduleData, UpdateScheduleData } from '../../types/schedule';
import { Child } from '../../types/child';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: CreateScheduleData | UpdateScheduleData) => Promise<void>;
  schedule?: Schedule | null;
  childrenData: Child[];
  defaultChildId?: number;
}

interface FormData {
  child_id: string;
  name: string;
  category: string;
  status: string;
  notes: string;
}

interface FormErrors {
  child_id?: string;
  name?: string;
  category?: string;
  status?: string;
  notes?: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schedule,
  childrenData,
  defaultChildId,
}) => {
  const { language } = useLanguage();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    child_id: '',
    name: '',
    category: '',
    status: 'not started',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        setFormData({
          child_id: schedule.child_id.toString(),
          name: schedule.name,
          category: schedule.category || '',
          status: schedule.status,
          notes: schedule.notes || '',
        });
      } else {
        setFormData({
          child_id: defaultChildId?.toString() || '',
          name: '',
          category: '',
          status: 'not started',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, schedule, defaultChildId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.child_id) {
      newErrors.child_id = texts.schedule.validation.childRequired[language];
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = texts.schedule.validation?.nameRequired?.[language] || 'Name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = texts.schedule.validation?.nameTooLong?.[language] || 'Name is too long';
    }

    if (formData.category && formData.category.length > 100) {
      newErrors.category =
        texts.schedule.validation?.categoryTooLong?.[language] || 'Category is too long';
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
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        status: formData.status as 'not started' | 'in progress' | 'done',
        notes: formData.notes.trim() || undefined,
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
      const errorMessage = schedule
        ? texts.schedule.messages.updateError[language]
        : texts.schedule.messages.createError[language];

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
                placeholder={`${texts.schedule.select[language]} ${texts.schedule.child[language].toLowerCase()}`}
              >
                {childrenData.map((child: Child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstname} {child.surname}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.child_id}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>{texts.schedule.name?.[language] || 'Name'}</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={texts.schedule.placeholders?.name?.[language] || 'Enter task name'}
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.category}>
              <FormLabel>{texts.schedule.category?.[language] || 'Category'}</FormLabel>
              <Input
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder={
                  texts.schedule.placeholders?.category?.[language] || 'Enter category (optional)'
                }
              />
              <FormErrorMessage>{errors.category}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.status}>
              <FormLabel>{texts.schedule.status?.label?.[language] || 'Status'}</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="not started">
                  {texts.schedule.status?.options?.notStarted?.[language] || 'Not Started'}
                </option>
                <option value="in progress">
                  {texts.schedule.status?.options?.inProgress?.[language] || 'In Progress'}
                </option>
                <option value="done">
                  {texts.schedule.status?.options?.done?.[language] || 'Done'}
                </option>
              </Select>
              <FormErrorMessage>{errors.status}</FormErrorMessage>
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
