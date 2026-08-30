import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, NativeSelect, VStack, Field } from '@chakra-ui/react';
import { CustomModal } from '@frontend/shared/ui/modal';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import {
  Presentation,
  PresentationStatus,
  CreatePresentationData,
  UpdatePresentationData,
} from '@frontend/types/presentation';
import { Child } from '@frontend/types/child';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

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
  const toast = useAppToast();
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
      newErrors.child_id = texts.schedule.validation.childRequired[language];
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = texts.schedule.validation.nameRequired[language];
    } else if (formData.name.length > 200) {
      newErrors.name = texts.schedule.validation.nameTooLong[language];
    }

    if (formData.category && formData.category.length > 100) {
      newErrors.category = texts.schedule.validation.categoryTooLong[language];
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
          title: texts.schedule.errors.childNotFound[language],
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
        status: formData.status as PresentationStatus,
        notes: formData.notes.trim() || undefined,
        ...(presentation && { id: presentation.id }),
      };

      await onSave(presentationData as CreatePresentationData | UpdatePresentationData);

      toast({
        title: presentation
          ? texts.schedule.success.updated[language]
          : texts.schedule.success.created[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error: unknown) {
      const errorMessage = presentation
        ? texts.schedule.errors.updateFailed[language]
        : texts.schedule.errors.createFailed[language];

      toast({
        title: errorMessage,
        description:
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
              (error as { message?: string }).message
            : texts.common.unknownError[language],
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
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={presentation ? texts.schedule.editEntry[language] : texts.schedule.addEntry[language]}
      buttons={
        <>
          <Button
            variant="brand"
            mr={3}
            onClick={handleSubmit}
            loading={isSubmitting}
            loadingText={texts.common.save[language]}
          >
            {texts.common.save[language]}
          </Button>
          <Button onClick={onClose} disabled={isSubmitting}>
            {texts.common.cancel[language]}
          </Button>
        </>
      }
    >
      <VStack gap={4}>
        <Field.Root required invalid={!!errors.child_id}>
          <Field.Label>{texts.schedule.child[language]}</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={formData.child_id}
              onChange={(e) => handleChange('child_id', e.target.value)}
              placeholder={`${texts.common.select[language]} ${texts.schedule.child[
                language
              ].toLowerCase()}`}
            >
              {childrenData.map((child: Child) => (
                <option key={child.id} value={child.id}>
                  {child.firstname} {child.surname}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.ErrorText>{errors.child_id}</Field.ErrorText>
        </Field.Root>

        <Field.Root required invalid={!!errors.name}>
          <Field.Label>{texts.schedule.name[language]}</Field.Label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={texts.schedule.placeholders.name[language]}
          />
          <Field.ErrorText>{errors.name}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.category}>
          <Field.Label>{texts.schedule.category[language]}</Field.Label>
          <Input
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder={texts.schedule.placeholders.category[language]}
          />
          <Field.ErrorText>{errors.category}</Field.ErrorText>
        </Field.Root>

        <Field.Root required invalid={!!errors.status}>
          <Field.Label>{texts.schedule.status.label[language]}</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="prerequisites not met">
                {texts.schedule.status.options.prerequisitesNotMet[language]}
              </option>
              <option value="to be presented">
                {texts.schedule.status.options.toBePresented[language]}
              </option>
              <option value="presented">{texts.schedule.status.options.presented[language]}</option>
              <option value="practiced">{texts.schedule.status.options.practiced[language]}</option>
              <option value="mastered">{texts.schedule.status.options.mastered[language]}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.ErrorText>{errors.status}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.notes}>
          <Field.Label>{texts.schedule.notes[language]}</Field.Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder={texts.schedule.placeholders.notes[language]}
            rows={3}
          />
          <Field.ErrorText>{errors.notes}</Field.ErrorText>
        </Field.Root>
      </VStack>
    </CustomModal>
  );
};

export default PresentationModal;
