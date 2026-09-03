import React, { useEffect, useState } from 'react';
import { Button, Input, Textarea, NumberInput, VStack, Field } from '@chakra-ui/react';
import { Select } from '@frontend/shared/components/Select';
import { CustomModal } from '@frontend/shared/ui/modal';
import {
  CategoryPresentation,
  CreateCategoryPresentationData,
} from '@frontend/types/presentation-category';
import texts from '@frontend/texts';
import { z } from 'zod';
import { presentationSchema } from '@frontend/shared/validation/presentationSchema';

interface FormErrors {
  category?: string;
  name?: string;
  age_group?: string;
  display_order?: string;
  notes?: string;
}

interface AddEditPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  editingPresentation: CategoryPresentation | null;
  formData: Partial<CreateCategoryPresentationData>;
  onFormDataChange: (data: Partial<CreateCategoryPresentationData>) => void;
  onSave: () => void;
  language: 'cs' | 'en';
  maxOrder: number;
}

const AddEditPresentationModal: React.FC<AddEditPresentationModalProps> = ({
  isOpen,
  onClose,
  categories,
  editingPresentation,
  formData,
  onFormDataChange,
  onSave,
  language,
  maxOrder,
}) => {
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.display_order && formData.display_order > maxOrder) {
      onFormDataChange({ ...formData, display_order: maxOrder });
    }
  }, [maxOrder, formData, onFormDataChange]);

  const handleSaveWithValidation = () => {
    try {
      const schema = presentationSchema(language);

      const validatedData = schema.parse({
        category: formData.category,
        name: formData.name,
        age_group: formData.age_group,
        display_order: formData.display_order,
        notes: formData.notes || undefined,
      });

      if (validatedData.display_order < 1) {
        setErrors((prev) => ({
          ...prev,
          display_order: texts.schedule.validation.orderValid[language],
        }));
        return;
      }

      setErrors({});
      onSave();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        editingPresentation
          ? texts.schedule.curriculum.editPresentation[language]
          : texts.schedule.curriculum.addPresentation[language]
      }
      buttons={
        <>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button variant="brand" onClick={handleSaveWithValidation}>
            {texts.common.save[language]}
          </Button>
        </>
      }
    >
      <VStack gap={4}>
        <Field.Root required invalid={!!errors.category}>
          <Field.Label>{texts.schedule.category[language]}</Field.Label>
          <Select
            options={categories.map((cat) => ({ label: cat, value: cat }))}
            value={formData.category || null}
            isSearchable={false}
            placeholder={`-- ${texts.common.select[language]} --`}
            onChange={(newValue) => {
              onFormDataChange({ ...formData, category: (newValue as string) || '' });
              if (errors.category) {
                setErrors((prev) => ({ ...prev, category: undefined }));
              }
            }}
          />
          {errors.category && <Field.ErrorText>{errors.category}</Field.ErrorText>}
        </Field.Root>

        <Field.Root required invalid={!!errors.age_group}>
          <Field.Label>{texts.schedule.ageGroup[language]}</Field.Label>
          <Select
            options={[
              { value: 'Infant', label: `${texts.classes.ageGroups.infant[language]} (0-1)` },
              { value: 'Toddler', label: `${texts.classes.ageGroups.toddler[language]} (1-3)` },
              {
                value: 'Early Childhood',
                label: `${texts.classes.ageGroups.earlyChildhood[language]} (3-6)`,
              },
              {
                value: 'Lower Elementary',
                label: `${texts.classes.ageGroups.lowerElementary[language]} (6-9)`,
              },
              {
                value: 'Upper Elementary',
                label: `${texts.classes.ageGroups.upperElementary[language]} (9-12)`,
              },
              {
                value: 'Middle School',
                label: `${texts.classes.ageGroups.middleSchool[language]} (12-15)`,
              },
            ]}
            value={formData.age_group || null}
            isSearchable={false}
            placeholder={`-- ${texts.common.select[language]} --`}
            onChange={(newValue) => {
              onFormDataChange({ ...formData, age_group: (newValue as string) || '' });
              if (errors.age_group) {
                setErrors((prev) => ({ ...prev, age_group: undefined }));
              }
            }}
          />
          {errors.age_group && <Field.ErrorText>{errors.age_group}</Field.ErrorText>}
        </Field.Root>

        <Field.Root required invalid={!!errors.name}>
          <Field.Label>{texts.schedule.name[language]}</Field.Label>
          <Input
            placeholder={texts.schedule.placeholders.name[language]}
            value={formData.name || ''}
            onChange={(e) => {
              onFormDataChange({ ...formData, name: e.target.value });
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
          />
          {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
        </Field.Root>

        <Field.Root required invalid={!!errors.display_order}>
          <Field.Label>{texts.schedule.order[language]}</Field.Label>
          <NumberInput.Root
            min={1}
            max={maxOrder}
            value={String(formData.display_order || 0)}
            onValueChange={(details) => {
              const parsedVal = details.valueAsNumber || 0;
              const clampedVal = Math.min(Math.max(parsedVal, 1), maxOrder);
              onFormDataChange({ ...formData, display_order: clampedVal });
              if (errors.display_order) {
                setErrors((prev) => ({ ...prev, display_order: undefined }));
              }
            }}
            disabled={!formData.category}
          >
            <NumberInput.Input />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
          {!formData.category && (
            <Field.ErrorText>
              {texts.schedule.validation.selectCategoryFirst[language]}
            </Field.ErrorText>
          )}
          {errors.display_order && <Field.ErrorText>{errors.display_order}</Field.ErrorText>}
        </Field.Root>

        <Field.Root>
          <Field.Label>{texts.schedule.notes[language]}</Field.Label>
          <Textarea
            placeholder={texts.schedule.placeholders.notes[language]}
            value={formData.notes || ''}
            onChange={(e) => {
              onFormDataChange({ ...formData, notes: e.target.value });
              if (errors.notes) {
                setErrors((prev) => ({ ...prev, notes: undefined }));
              }
            }}
            rows={4}
          />
        </Field.Root>
      </VStack>
    </CustomModal>
  );
};

export default AddEditPresentationModal;
