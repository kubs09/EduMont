import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  VStack,
  FormErrorMessage,
  NumberInputStepper,
  NumberDecrementStepper,
  NumberIncrementStepper,
} from '@chakra-ui/react';
import {
  CategoryPresentation,
  CreateCategoryPresentationData,
} from '@frontend/services/api/presentation';
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
          display_order: texts.presentation.validation.presentationOrderValid[language],
        }));
        return;
      }

      setErrors({});
      onSave();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editingPresentation
            ? texts.presentation.curriculum.editPresentation[language]
            : texts.presentation.curriculum.addPresentation[language]}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.category}>
              <FormLabel>{texts.presentation.category[language]}</FormLabel>
              <Select
                value={formData.category || ''}
                onChange={(e) => {
                  onFormDataChange({ ...formData, category: e.target.value });
                  if (errors.category) {
                    setErrors((prev) => ({ ...prev, category: undefined }));
                  }
                }}
              >
                <option value="">-- {texts.presentation.select[language]} --</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
              {errors.category && <FormErrorMessage>{errors.category}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.age_group}>
              <FormLabel>{texts.presentation.ageGroup[language]}</FormLabel>
              <Select
                value={formData.age_group || ''}
                onChange={(e) => {
                  onFormDataChange({ ...formData, age_group: e.target.value });
                  if (errors.age_group) {
                    setErrors((prev) => ({ ...prev, age_group: undefined }));
                  }
                }}
              >
                <option value="">-- {texts.presentation.select[language]} --</option>
                <option value="Infant">{texts.classes.ageGroups.infant[language]} (0-1)</option>
                <option value="Toddler">{texts.classes.ageGroups.toddler[language]} (1-3)</option>
                <option value="Early Childhood">
                  {texts.classes.ageGroups.earlyChildhood[language]} (3-6)
                </option>
                <option value="Lower Elementary">
                  {texts.classes.ageGroups.lowerElementary[language]} (6-9)
                </option>
                <option value="Upper Elementary">
                  {texts.classes.ageGroups.upperElementary[language]} (9-12)
                </option>
                <option value="Middle School">
                  {texts.classes.ageGroups.middleSchool[language]} (12-15)
                </option>
              </Select>
              {errors.age_group && <FormErrorMessage>{errors.age_group}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>{texts.presentation.name[language]}</FormLabel>
              <Input
                placeholder={texts.presentation.placeholders.name[language]}
                value={formData.name || ''}
                onChange={(e) => {
                  onFormDataChange({ ...formData, name: e.target.value });
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
              />
              {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.display_order}>
              <FormLabel>{texts.presentation.order[language]}</FormLabel>
              <NumberInput
                min={1}
                max={maxOrder}
                value={formData.display_order || 0}
                onChange={(val) => {
                  const parsedVal = parseInt(val) || 0;
                  const clampedVal = Math.min(Math.max(parsedVal, 1), maxOrder);
                  onFormDataChange({ ...formData, display_order: clampedVal });
                  if (errors.display_order) {
                    setErrors((prev) => ({ ...prev, display_order: undefined }));
                  }
                }}
                isDisabled={!formData.category}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              {!formData.category && (
                <FormErrorMessage>
                  {texts.presentation.validation.selectCategoryFirst[language]}
                </FormErrorMessage>
              )}
              {errors.display_order && <FormErrorMessage>{errors.display_order}</FormErrorMessage>}
            </FormControl>

            <FormControl>
              <FormLabel>{texts.presentation.notes[language]}</FormLabel>
              <Textarea
                placeholder={texts.presentation.placeholders.notes[language]}
                value={formData.notes || ''}
                onChange={(e) => {
                  onFormDataChange({ ...formData, notes: e.target.value });
                  if (errors.notes) {
                    setErrors((prev) => ({ ...prev, notes: undefined }));
                  }
                }}
                rows={4}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button variant="primary" onClick={handleSaveWithValidation}>
            {texts.common.save[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddEditPresentationModal;
