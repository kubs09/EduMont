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
  Select,
  Textarea,
  ThemingProps,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { ClassTeacher } from '@frontend/types/class';
import { classInfoSchema } from '../../shared/validation/classSchema';
import { classAgeRanges } from '../utils/ageRanges';
import { z } from 'zod';

interface Class {
  id: number;
  name: string;
  description: string;
  age_group: string;
  min_age: number;
  max_age: number;
  teachers: ClassTeacher[];
  children: Array<{ id: number; firstname: string; surname: string }>;
}

interface EditClassInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
  onSave: (updatedInfo: {
    name: string;
    description: string;
    age_group: string;
    min_age: number;
    max_age: number;
    teacherId: number;
    assistantId: number;
  }) => Promise<void>;
  size?: ThemingProps['size'] | { base: string; md: string };
}

interface FormErrors {
  name?: string;
  description?: string;
  minAge?: string;
  maxAge?: string;
}

export const EditClassInfoModal = ({
  isOpen,
  onClose,
  classData,
  onSave,
  size = { base: 'full', md: 'lg' },
}: EditClassInfoModalProps) => {
  const { language } = useLanguage();
  const [name, setName] = useState(classData.name);
  const [description, setDescription] = useState(classData.description);
  const initialRange =
    classAgeRanges.find(
      (range) => range.minAge === classData.min_age && range.maxAge === classData.max_age
    ) ?? classAgeRanges[0];
  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setName(classData.name);
    setDescription(classData.description);
    const nextRange =
      classAgeRanges.find(
        (range) => range.minAge === classData.min_age && range.maxAge === classData.max_age
      ) ?? classAgeRanges[0];
    setSelectedRange(nextRange);
    setErrors({});
  }, [isOpen, classData]);

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const validationResult = classInfoSchema(language).parse({
        name,
        description,
        minAge: selectedRange.minAge,
        maxAge: selectedRange.maxAge,
      });

      await onSave({
        name: validationResult.name,
        description: validationResult.description,
        age_group: selectedRange.ageGroup,
        min_age: validationResult.minAge,
        max_age: validationResult.maxAge,
        teacherId: classData.teachers.find((t) => t.class_role === 'teacher')?.id ?? 0,
        assistantId: classData.teachers.find((t) => t.class_role === 'assistant')?.id ?? 0,
      });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
      } else {
        console.error('Error saving class:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name && description;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.classes.editClassTitle[language]}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isInvalid={!!errors.name} isRequired>
            <FormLabel>{texts.classes.name[language]}</FormLabel>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} />
            {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.description} isRequired>
            <FormLabel>{texts.classes.description[language]}</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
            />
            {errors.description && <FormErrorMessage>{errors.description}</FormErrorMessage>}
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>{texts.classes.ageRange[language]}</FormLabel>
            <Select
              value={`${selectedRange.minAge}-${selectedRange.maxAge}`}
              onChange={(e) => {
                const [minAgeValue, maxAgeValue] = e.target.value
                  .split('-')
                  .map((value) => Number(value));
                const matchedRange = classAgeRanges.find(
                  (range) => range.minAge === minAgeValue && range.maxAge === maxAgeValue
                );
                if (matchedRange) {
                  setSelectedRange(matchedRange);
                  setErrors((prev) => ({ ...prev, minAge: undefined, maxAge: undefined }));
                }
              }}
            >
              {classAgeRanges.map((range) => (
                <option key={range.key} value={`${range.minAge}-${range.maxAge}`}>
                  {texts.classes.ageRanges[range.key][language]} - {range.minAge} - {range.maxAge}{' '}
                  {texts.classes.years[language]}
                </option>
              ))}
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSave}
            isLoading={isSubmitting}
            isDisabled={!isFormValid && !isSubmitting}
          >
            {texts.common.save[language]}
          </Button>
          <Button onClick={onClose}>{texts.common.cancel[language]}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
