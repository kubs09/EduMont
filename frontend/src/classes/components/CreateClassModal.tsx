import { Button, Input, Textarea, Field } from '@chakra-ui/react';
import { Select } from '@frontend/shared/components/Select';
import { CustomModal } from '@frontend/shared/ui/modal';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { getUsers } from '@frontend/services/api/user';
import { createClass, getClasses } from '@frontend/services/api/class';
import { User } from '@frontend/types/user';
import { Class as ClassType } from '@frontend/types/class';
import { classAgeGroups, type ClassAgeGroupKey } from '../utils/ageGroups';
import { classInfoSchema, classTeachersSchema } from '@frontend/shared/validation/classSchema';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  minAge?: string;
  maxAge?: string;
  teacherId?: string;
  assistantId?: string;
}

const CreateClassModal = ({ isOpen, onClose, onSuccess }: CreateClassModalProps) => {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<{
    key: ClassAgeGroupKey;
    ageGroup: string;
    minAge: number;
    maxAge: number;
  }>(classAgeGroups[0]);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [assistantId, setAssistantId] = useState<number | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [allClasses, setAllClasses] = useState<ClassType[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setName('');
    setDescription('');
    setSelectedGroup(classAgeGroups[0]);
    setTeacherId(null);
    setAssistantId(null);
    setErrors({});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTeachers = async () => {
      try {
        const data = await getUsers('teacher');
        setAvailableTeachers(data);
      } catch (error) {
        console.error(texts.classes.errors.fetchTeachersFailed[language], error);
      }
    };

    const fetchAllClasses = async () => {
      try {
        const classes = await getClasses();
        setAllClasses(classes);
      } catch (error) {
        console.error(texts.classes.errors.fetchClassesFailed[language], error);
      }
    };

    fetchTeachers();
    fetchAllClasses();
  }, [isOpen, language]);

  const groupOptions = useMemo(
    () =>
      classAgeGroups.map((group) => ({
        value: `${group.minAge}-${group.maxAge}`,
        label: `${texts.classes.ageGroups[group.key][language]} - ${group.minAge} - ${
          group.maxAge
        } ${texts.classes.years[language]}`,
        minAge: group.minAge,
        maxAge: group.maxAge,
      })),
    [language]
  );

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  const handleTeacherChange = (value: number | null) => {
    setTeacherId(value);
    if (value && assistantId === value) {
      setAssistantId(null);
    }
  };

  const handleAssistantChange = (value: number | null) => {
    setAssistantId(value);
  };

  const isTeacherAssignedToAnotherClass = (
    newTeacherId: number | null,
    newAssistantId: number | null
  ) => {
    return allClasses.some((cls) => {
      return cls.teachers.some((teacher) => {
        if (newTeacherId && teacher.id === newTeacherId) return true;
        if (newAssistantId && teacher.id === newAssistantId) return true;
        return false;
      });
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      const data = {
        name,
        description,
        minAge: selectedGroup.minAge,
        maxAge: selectedGroup.maxAge,
        teacherId,
        assistantId,
      };

      classInfoSchema(language).parse({
        name: data.name,
        description: data.description,
        minAge: data.minAge,
        maxAge: data.maxAge,
      });
      classTeachersSchema(language).parse({
        teacherId: data.teacherId,
        assistantId: data.assistantId,
      });

      if (isTeacherAssignedToAnotherClass(teacherId, assistantId)) {
        setErrors({
          teacherId: texts.classes.validation.teacherAlreadyAssigned[language],
        });
        return;
      }

      await createClass({
        name,
        description,
        age_group: selectedGroup.ageGroup,
        min_age: selectedGroup.minAge,
        max_age: selectedGroup.maxAge,
        teacherId: teacherId as number,
        assistantId,
      });

      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
        return;
      }

      const apiError = error as { message?: string } | null | undefined;
      console.error(texts.classes.errors.createFailed[language], apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: 'full', md: 'lg' }}
      title={texts.classes.createClassTitle[language]}
      buttons={
        <>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button variant="brand" onClick={handleSubmit} loading={isSubmitting}>
            {texts.classes.createClass[language]}
          </Button>
        </>
      }
    >
      <Field.Root invalid={!!errors.name} required>
        <Field.Label>{texts.classes.name[language]}</Field.Label>
        <Input value={name} onChange={(e) => handleNameChange(e.target.value)} />
        {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
      </Field.Root>
      <Field.Root mt={4} invalid={!!errors.description} required>
        <Field.Label>{texts.classes.description[language]}</Field.Label>
        <Textarea value={description} onChange={(e) => handleDescriptionChange(e.target.value)} />
        {errors.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
      </Field.Root>
      <Field.Root mt={4} required>
        <Field.Label>{texts.classes.ageRange[language]}</Field.Label>
        <Select
          options={groupOptions}
          value={`${selectedGroup.minAge}-${selectedGroup.maxAge}`}
          isSearchable={false}
          onChange={(newValue) => {
            const option = groupOptions.find((group) => group.value === newValue);
            if (!option) return;

            const matchedGroup = classAgeGroups.find(
              (group) => group.minAge === option.minAge && group.maxAge === option.maxAge
            );

            if (matchedGroup) {
              setSelectedGroup(matchedGroup);
              setErrors((prev) => ({ ...prev, minAge: undefined, maxAge: undefined }));
            }
          }}
        />
      </Field.Root>
      <Field.Root mt={4} invalid={!!errors.teacherId} required>
        <Field.Label>{texts.classes.teacher[language]}</Field.Label>
        <Select
          options={availableTeachers.map((teacher) => ({
            label: `${teacher.firstname} ${teacher.surname}`,
            value: teacher.id,
          }))}
          value={teacherId}
          isSearchable={false}
          placeholder={texts.classes.selectTeacher[language]}
          onChange={(newValue) => {
            handleTeacherChange(newValue ? Number(newValue) : null);
          }}
        />
        {errors.teacherId && <Field.ErrorText>{errors.teacherId}</Field.ErrorText>}
      </Field.Root>
      <Field.Root mt={4} invalid={!!errors.assistantId}>
        <Field.Label>{texts.classes.assistant[language]}</Field.Label>
        <Select
          options={availableTeachers.map((teacher) => ({
            label: `${teacher.firstname} ${teacher.surname}`,
            value: teacher.id,
            disabled: teacherId === teacher.id,
          }))}
          value={assistantId}
          isSearchable={false}
          placeholder={texts.classes.selectAssistant[language]}
          onChange={(newValue) => {
            handleAssistantChange(newValue ? Number(newValue) : null);
          }}
        />
        {errors.assistantId && <Field.ErrorText>{errors.assistantId}</Field.ErrorText>}
      </Field.Root>
    </CustomModal>
  );
};

export default CreateClassModal;
