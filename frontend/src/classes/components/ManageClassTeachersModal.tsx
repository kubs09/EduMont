import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Box,
  Text,
  FormControl,
  FormLabel,
  Select,
  useToast,
  ThemingProps,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Teacher } from '@frontend/types/teacher';
import { ClassTeacher } from '@frontend/types/class';
import { classTeachersSchema } from '../schemas/classSchema';

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: ClassTeacher[];
}

interface ManageClassTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
  availableTeachers: Teacher[];
  onSave: (selection: { teacherId: number; assistantId: number | null }) => Promise<void>;
  size?: ThemingProps['size'] | { base: string; md: string };
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
  const toast = useToast();
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [assistantId, setAssistantId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && classData.teachers) {
      const primaryTeacher = classData.teachers.find((t) => t.class_role === 'teacher');
      const assistantTeacher = classData.teachers.find((t) => t.class_role === 'assistant');
      setTeacherId(primaryTeacher?.id ?? null);
      setAssistantId(assistantTeacher?.id ?? null);
    }
  }, [isOpen, classData.teachers]);

  const handleSave = async () => {
    try {
      classTeachersSchema.parse({ teacherId, assistantId });
      await onSave({ teacherId: teacherId as number, assistantId });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorPath = error.errors[0]?.path?.[0];
        const errorTitle =
          errorPath === 'assistantId'
            ? texts.classes.validation.assistantSameAsTeacher[language]
            : texts.classes.validation.teacherRequired[language];
        toast({
          title: errorTitle,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.error('Error saving teachers:', error);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.classes.manageTeachersTitle[language]}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text mb={2} fontWeight="medium">
                {texts.classes.teachers[language]}
              </Text>
              <VStack spacing={3} align="stretch">
                <FormControl>
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
                <FormControl>
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
                      <option
                        key={teacher.id}
                        value={teacher.id}
                        disabled={teacherId === teacher.id}
                      >
                        {teacher.firstname} {teacher.surname}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSave}>
            {texts.common.save[language]}
          </Button>
          <Button onClick={onClose}>{texts.common.cancel[language]}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ManageClassTeachersModal;
