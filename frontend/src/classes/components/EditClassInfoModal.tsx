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
  useToast,
  ThemingProps,
} from '@chakra-ui/react';
import { useState } from 'react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { ClassTeacher } from '@frontend/types/class';
import { classSchema } from '../schemas/classSchema';
import { z } from 'zod';

interface Class {
  id: number;
  name: string;
  description: string;
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
    min_age: number;
    max_age: number;
    teacherId: number;
    assistantId: number | null;
  }) => Promise<void>;
  size?: ThemingProps['size'] | { base: string; md: string };
}

export const EditClassInfoModal = ({
  isOpen,
  onClose,
  classData,
  onSave,
  size = { base: 'full', md: 'lg' },
}: EditClassInfoModalProps) => {
  const { language } = useLanguage();
  const toast = useToast();
  const [name, setName] = useState(classData.name);
  const [description, setDescription] = useState(classData.description);
  const [minAge, setMinAge] = useState(classData.min_age);
  const [maxAge, setMaxAge] = useState(classData.max_age);

  const handleSave = async () => {
    try {
      const validationResult = classSchema.parse({
        name,
        description,
        minAge,
        maxAge,
      });

      const primaryTeacher = classData.teachers.find((t) => t.class_role === 'teacher');
      const assistantTeacher = classData.teachers.find((t) => t.class_role === 'assistant');

      if (!primaryTeacher) {
        toast({
          title: texts.classes.validation.teacherRequired[language],
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await onSave({
        name: validationResult.name,
        description: validationResult.description,
        min_age: validationResult.minAge,
        max_age: validationResult.maxAge,
        teacherId: primaryTeacher.id,
        assistantId: assistantTeacher?.id ?? null,
      });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: error.errors[0].message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.error('Error saving class:', error);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.classes.editClassTitle[language]}</ModalHeader>
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
            <FormLabel>{texts.classes.minAge[language]}</FormLabel>
            <Input
              type="number"
              value={minAge}
              onChange={(e) => setMinAge(parseInt(e.target.value))}
              min={0}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>{texts.classes.maxAge[language]}</FormLabel>
            <Input
              type="number"
              value={maxAge}
              onChange={(e) => setMaxAge(parseInt(e.target.value))}
              min={minAge}
            />
          </FormControl>
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
