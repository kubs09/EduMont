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
} from '@chakra-ui/react';
import { useState } from 'react';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { Teacher } from '../../types/teacher';

interface Class {
  id: number;
  name: string;
  description: string;
  min_age: number;
  max_age: number;
  teachers: Teacher[];
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
  }) => Promise<void>;
}

export const EditClassInfoModal = ({
  isOpen,
  onClose,
  classData,
  onSave,
}: EditClassInfoModalProps) => {
  const { language } = useLanguage();
  const [name, setName] = useState(classData.name);
  const [description, setDescription] = useState(classData.description);
  const [minAge, setMinAge] = useState(classData.min_age);
  const [maxAge, setMaxAge] = useState(classData.max_age);

  const handleSave = async () => {
    await onSave({
      name,
      description,
      min_age: minAge,
      max_age: maxAge,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
