import { Button, Input, NativeSelect, Textarea, Field, Dialog, Portal } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Class } from '@frontend/types/class';
import { classInfoSchema } from '@frontend/shared/validation/classSchema';
import { classAgeGroups } from '../utils/ageGroups';
import { z } from 'zod';

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
  size?: Dialog.RootProps['size'] | { base: Dialog.RootProps['size']; md: Dialog.RootProps['size'] };
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
  const initialGroup =
    classAgeGroups.find(
      (group) => group.minAge === classData.min_age && group.maxAge === classData.max_age
    ) ?? classAgeGroups[0];
  const [selectedGroup, setSelectedGroup] = useState(initialGroup);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setName(classData.name);
    setDescription(classData.description);
    const nextGroup =
      classAgeGroups.find(
        (group) => group.minAge === classData.min_age && group.maxAge === classData.max_age
      ) ?? classAgeGroups[0];
    setSelectedGroup(nextGroup);
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
        minAge: selectedGroup.minAge,
        maxAge: selectedGroup.maxAge,
      });

      await onSave({
        name: validationResult.name,
        description: validationResult.description,
        age_group: selectedGroup.ageGroup,
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
    <Dialog.Root open={isOpen} size={size} onOpenChange={e => {
      if (!e.open) {
        onClose();
      }
    }}>
      <Portal>

        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>{texts.classes.editClassTitle[language]}</Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              <Field.Root invalid={!!errors.name} required>
                <Field.Label>{texts.classes.name[language]}</Field.Label>
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} />
                {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
              </Field.Root>
              <Field.Root mt={4} invalid={!!errors.description} required>
                <Field.Label>{texts.classes.description[language]}</Field.Label>
                <Textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                />
                {errors.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
              </Field.Root>
              <Field.Root mt={4} required>
                <Field.Label>{texts.classes.ageRange[language]}</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={`${selectedGroup.minAge}-${selectedGroup.maxAge}`}
                    onChange={(e) => {
                      const [minAgeValue, maxAgeValue] = e.target.value
                        .split('-')
                        .map((value) => Number(value));
                      const matchedGroup = classAgeGroups.find(
                        (group) => group.minAge === minAgeValue && group.maxAge === maxAgeValue
                      );
                      if (matchedGroup) {
                        setSelectedGroup(matchedGroup);
                        setErrors((prev) => ({ ...prev, minAge: undefined, maxAge: undefined }));
                      }
                    }}>
                    {classAgeGroups.map((group) => (
                      <option key={group.key} value={`${group.minAge}-${group.maxAge}`}>
                        {texts.classes.ageGroups[group.key][language]} - {group.minAge} - {group.maxAge}{' '}
                        {texts.classes.years[language]}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                colorPalette="blue"
                mr={3}
                onClick={handleSave}
                loading={isSubmitting}
                disabled={!isFormValid && !isSubmitting}
              >
                {texts.common.save[language]}
              </Button>
              <Button onClick={onClose}>{texts.common.cancel[language]}</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};
