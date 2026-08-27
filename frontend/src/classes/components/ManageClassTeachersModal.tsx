import { Button, VStack, Box, Text, NativeSelect, Field, Dialog } from '@chakra-ui/react';
import { CustomModal } from '@frontend/shared/ui/modal';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Teacher } from '@frontend/types/teacher';
import { Class } from '@frontend/types/class';
import { classTeachersSchema } from '@frontend/shared/validation/classSchema';
import { getClasses } from '@frontend/services/api/class';

interface ManageClassTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
  availableTeachers: Teacher[];
  onSave: (selection: { teacherId: number; assistantId: number | null }) => Promise<void>;
  size?:
    Dialog.RootProps['size'] | { base: Dialog.RootProps['size']; md: Dialog.RootProps['size'] };
}

interface FormErrors {
  teacherId?: string;
  assistantId?: string;
}

export const ManageClassTeachersModal = ({
  isOpen,
  onClose,
  classData,
  availableTeachers,
  onSave,
  size = { base: 'full', md: 'lg' },
}: ManageClassTeachersModalProps) => {
  const { language } = useLanguage();
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [assistantId, setAssistantId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allClasses, setAllClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (isOpen && classData.teachers) {
      const primaryTeacher = classData.teachers.find((t) => t.class_role === 'teacher');
      const assistantTeacher = classData.teachers.find((t) => t.class_role === 'assistant');
      setTeacherId(primaryTeacher?.id ?? null);
      setAssistantId(assistantTeacher?.id ?? null);
      setErrors({});

      const fetchAllClasses = async () => {
        try {
          const classes = await getClasses();
          setAllClasses(classes);
        } catch (error) {
          console.error(texts.classes.errors.fetchClassesFailed[language], error);
        }
      };

      fetchAllClasses();
    }
  }, [language, isOpen, classData.teachers]);

  const handleTeacherChange = (value: number | null) => {
    setTeacherId(value);
    if (value && assistantId === value) {
      setAssistantId(null);
    }
  };

  const handleAssistantChange = (value: number | null) => {
    setAssistantId(value);
  };

  const isTeacherAssignedToAnotherClass = (newTeacherId: number, newAssistantId: number | null) => {
    return allClasses.some((cls) => {
      if (cls.id === classData.id) return false;

      return cls.teachers.some((teacher) => {
        if (newTeacherId && teacher.id === newTeacherId) return true;
        if (newAssistantId && teacher.id === newAssistantId) return true;
        return false;
      });
    });
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});
      const data = { teacherId, assistantId };
      classTeachersSchema(language).parse(data);
      if (isTeacherAssignedToAnotherClass(teacherId as number, assistantId)) {
        setErrors({
          teacherId: texts.classes.validation.teacherAlreadyAssigned[language],
        });
        return;
      }

      await onSave(data as { teacherId: number; assistantId: number | null });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
      } else {
        console.error(texts.classes.errors.savingTeachersFailed[language], error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      title={texts.classes.manageTeachersTitle[language]}
      buttons={
        <>
          <Button colorPalette="blue" mr={3} onClick={handleSave} loading={isSubmitting}>
            {texts.common.save[language]}
          </Button>
          <Button onClick={onClose}>{texts.common.cancel[language]}</Button>
        </>
      }
    >
      <VStack gap={4} align="stretch">
        <Box>
          <Text mb={2} fontWeight="medium">
            {texts.classes.teachers[language]}
          </Text>
          <VStack gap={3} align="stretch">
            <Field.Root invalid={!!errors.teacherId} required>
              <Field.Label>{texts.classes.teacher[language]}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  placeholder={texts.classes.selectTeacher[language]}
                  value={teacherId ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    handleTeacherChange(value);
                  }}
                >
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstname} {teacher.surname}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              {errors.teacherId && <Field.ErrorText>{errors.teacherId}</Field.ErrorText>}
            </Field.Root>
            <Field.Root invalid={!!errors.assistantId} required>
              <Field.Label>{texts.classes.assistant[language]}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  placeholder={texts.classes.selectAssistant[language]}
                  value={assistantId ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    handleAssistantChange(value);
                  }}
                >
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id} disabled={teacherId === teacher.id}>
                      {teacher.firstname} {teacher.surname}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              {errors.assistantId && <Field.ErrorText>{errors.assistantId}</Field.ErrorText>}
            </Field.Root>
          </VStack>
        </Box>
      </VStack>
    </CustomModal>
  );
};

export default ManageClassTeachersModal;
