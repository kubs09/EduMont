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
  useToast,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { getUsers } from '@frontend/services/api/user';
import { createClass } from '@frontend/services/api/class';
import { User } from '@frontend/types/shared';
import { classAgeRanges, type ClassAgeRangeKey } from '../utils/ageRanges';
import { classSchema, classTeachersSchema } from '../schemas/classSchema';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateClassModal = ({ isOpen, onClose, onSuccess }: CreateClassModalProps) => {
  const { language } = useLanguage();
  const toast = useToast();
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

  useEffect(() => {
    if (!isOpen) return;

    setName('');
    setDescription('');
    setSelectedRange(classAgeRanges[0]);
    setTeacherId(null);
    setAssistantId(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTeachers = async () => {
      try {
        const data = await getUsers('teacher');
        setAvailableTeachers(data);
      } catch (error) {
        toast({
          title: texts.common.userDashboard.errorTitle[language],
          description: error.message || texts.classes.createError[language],
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchTeachers();
  }, [isOpen, language, toast]);

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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      classSchema.parse({
        name,
        description,
        minAge: selectedRange.minAge,
        maxAge: selectedRange.maxAge,
      });
      classTeachersSchema.parse({ teacherId, assistantId });

      await createClass({
        name,
        description,
        min_age: selectedRange.minAge,
        max_age: selectedRange.maxAge,
        teacherId: teacherId as number,
        assistantId,
      });

      toast({
        title: texts.classes.createSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: error.errors[0].message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const apiError = error as { message?: string };
      toast({
        title: texts.classes.createError[language],
        description: apiError.message || texts.classes.createError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
          <FormControl>
            <FormLabel>{texts.classes.name[language]}</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>{texts.classes.description[language]}</FormLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormControl>
          <FormControl mt={4}>
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
          <FormControl mt={4}>
            <FormLabel>{texts.classes.teacher[language]}</FormLabel>
            <Select
              placeholder={texts.classes.selectTeachers[language]}
              value={teacherId ?? ''}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setTeacherId(value);
                if (value && assistantId === value) {
                  setAssistantId(null);
                }
              }}
            >
              {availableTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstname} {teacher.surname}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>{texts.classes.assistant[language]}</FormLabel>
            <Select
              placeholder={texts.classes.selectTeachers[language]}
              value={assistantId ?? ''}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setAssistantId(value);
              }}
            >
              {availableTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id} disabled={teacherId === teacher.id}>
                  {teacher.firstname} {teacher.surname}
                </option>
              ))}
            </Select>
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
