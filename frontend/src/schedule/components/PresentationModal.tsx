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
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import {
  Presentation,
  CreatePresentationData,
  UpdatePresentationData,
} from '@frontend/types/presentation';
import { Child } from '@frontend/types/child';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (presentationData: CreatePresentationData | UpdatePresentationData) => Promise<void>;
  presentation?: Presentation | null;
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

const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  presentation,
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
    status: 'to be presented',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (presentation) {
        setFormData({
          child_id: presentation.child_id.toString(),
          name: presentation.name,
          category: presentation.category || '',
          status: presentation.status,
          notes: presentation.notes || '',
        });
      } else {
        setFormData({
          child_id: defaultChildId?.toString() || '',
          name: '',
          category: '',
          status: 'to be presented',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, presentation, defaultChildId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.child_id) {
      newErrors.child_id = texts.presentation.validation.childRequired[language];
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name =
        texts.presentation.validation?.nameRequired?.[language] || 'Name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = texts.presentation.validation?.nameTooLong?.[language] || 'Name is too long';
    }

    if (formData.category && formData.category.length > 100) {
      newErrors.category =
        texts.presentation.validation?.categoryTooLong?.[language] || 'Category is too long';
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

      const presentationData = {
        child_id: parseInt(formData.child_id),
        class_id: selectedChild.class_id,
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        status: formData.status as
          | 'prerequisites not met'
          | 'to be presented'
          | 'presented'
          | 'practiced'
          | 'mastered',
        notes: formData.notes.trim() || undefined,
        ...(presentation && { id: presentation.id }),
      };

      await onSave(presentationData as CreatePresentationData | UpdatePresentationData);

      toast({
        title: presentation
          ? texts.presentation.messages.updateSuccess[language]
          : texts.presentation.messages.createSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error: unknown) {
      const errorMessage = presentation
        ? texts.presentation.messages.updateError[language]
        : texts.presentation.messages.createError[language];

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
          {presentation
            ? texts.presentation.editEntry[language]
            : texts.presentation.addEntry[language]}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.child_id}>
              <FormLabel>{texts.presentation.child[language]}</FormLabel>
              <Select
                value={formData.child_id}
                onChange={(e) => handleChange('child_id', e.target.value)}
                placeholder={`${texts.presentation.select[language]} ${texts.presentation.child[language].toLowerCase()}`}
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
              <FormLabel>{texts.presentation.name?.[language] || 'Name'}</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={texts.presentation.placeholders?.name?.[language] || 'Enter task name'}
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.category}>
              <FormLabel>{texts.presentation.category?.[language] || 'Category'}</FormLabel>
              <Input
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder={
                  texts.presentation.placeholders?.category?.[language] ||
                  'Enter category (optional)'
                }
              />
              <FormErrorMessage>{errors.category}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.status}>
              <FormLabel>{texts.presentation.status?.label?.[language] || 'Status'}</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="prerequisites not met">
                  {texts.presentation.status?.options?.prerequisitesNotMet?.[language] ||
                    'Prerequisites Not Met'}
                </option>
                <option value="to be presented">
                  {texts.presentation.status?.options?.toBePresented?.[language] ||
                    'To Be Presented'}
                </option>
                <option value="presented">
                  {texts.presentation.status?.options?.presented?.[language] || 'Presented'}
                </option>
                <option value="practiced">
                  {texts.presentation.status?.options?.practiced?.[language] || 'Practiced'}
                </option>
                <option value="mastered">
                  {texts.presentation.status?.options?.mastered?.[language] || 'Mastered'}
                </option>
              </Select>
              <FormErrorMessage>{errors.status}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.notes}>
              <FormLabel>{texts.presentation.notes[language]}</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={texts.presentation.placeholders.notes[language]}
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

export default PresentationModal;
