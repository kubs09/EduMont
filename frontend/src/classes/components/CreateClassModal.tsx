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
  FormErrorMessage,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { getUsers } from '@frontend/services/api/user';
import { createClass, getClasses } from '@frontend/services/api/class';
import { User } from '@frontend/types/shared';
import { Class as ClassType } from '@frontend/types/class';
import { classAgeRanges, type ClassAgeRangeKey } from '../utils/ageRanges';
import { classInfoSchema, classTeachersSchema } from '../schemas/classSchema';

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
  const [selectedRange, setSelectedRange] = useState<{
    key: ClassAgeRangeKey;
    minAge: number;
    maxAge: number;
  }>(classAgeRanges[0]);
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
    setSelectedRange(classAgeRanges[0]);
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
        console.error(texts.classes.error.errorFetchTeachers[language], error);
      }
    };

    const fetchAllClasses = async () => {
      try {
        const classes = await getClasses();
        setAllClasses(classes);
      } catch (error) {
        console.error(texts.classes.error.errorFetchClass[language], error);
      }
    };

    fetchTeachers();
    fetchAllClasses();
  }, [isOpen, language]);

  const rangeOptions = useMemo(
    () =>
      classAgeRanges.map((range) => ({
        value: `${range.minAge}-${range.maxAge}`,
        label: `${texts.classes.ageRanges[range.key][language]} - ${range.minAge} - ${range.maxAge} ${texts.classes.years[language]}`,
        minAge: range.minAge,
        maxAge: range.maxAge,
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
        minAge: selectedRange.minAge,
        maxAge: selectedRange.maxAge,
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
        min_age: selectedRange.minAge,
        max_age: selectedRange.maxAge,
        teacherId: teacherId as number,
        assistantId,
      });

      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
        return;
      }

      const apiError = error as { message?: string } | null | undefined;
      console.error(texts.classes.error.errorCreateClass[language], apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.classes.createClassTitle[language]}</ModalHeader>
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
                const option = rangeOptions.find((range) => range.value === e.target.value);
                if (!option) return;

                const matchedRange = classAgeRanges.find(
                  (range) => range.minAge === option.minAge && range.maxAge === option.maxAge
                );

                if (matchedRange) {
                  setSelectedRange(matchedRange);
                  setErrors((prev) => ({ ...prev, minAge: undefined, maxAge: undefined }));
                }
              }}
            >
              {rangeOptions.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.teacherId} isRequired>
            <FormLabel>{texts.classes.teacher[language]}</FormLabel>
            <Select
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
            </Select>
            {errors.teacherId && <FormErrorMessage>{errors.teacherId}</FormErrorMessage>}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.assistantId}>
            <FormLabel>{texts.classes.assistant[language]}</FormLabel>
            <Select
              placeholder={texts.classes.SelectAssistant[language]}
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
            </Select>
            {errors.assistantId && <FormErrorMessage>{errors.assistantId}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>
            {texts.classes.createClass[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateClassModal;
