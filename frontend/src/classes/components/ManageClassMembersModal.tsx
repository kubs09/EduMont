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
  Stack,
  Checkbox,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { Teacher } from '../../types/teacher';

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: Teacher[];
}

interface ManageClassTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
  availableTeachers: Teacher[];
  onSave: (teacherIds: number[]) => Promise<void>;
}

export const ManageClassTeachersModal = ({
  isOpen,
  onClose,
  classData,
  availableTeachers,
  onSave,
}: ManageClassTeachersModalProps) => {
  const { language } = useLanguage();
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);

  // Initialize selected teachers when modal opens
  useEffect(() => {
    if (isOpen && classData.teachers) {
      setSelectedTeachers(classData.teachers.map((t) => t.id));
    }
  }, [isOpen, classData.teachers]);

  const handleSave = async () => {
    try {
      console.log('Saving teachers:', selectedTeachers);
      await onSave(selectedTeachers);
      onClose();
    } catch (error) {
      console.error('Error saving teachers:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
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
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2}>
                <Stack spacing={2}>
                  {availableTeachers.map((teacher) => (
                    <Checkbox
                      key={teacher.id}
                      isChecked={selectedTeachers.includes(teacher.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeachers([...selectedTeachers, teacher.id]);
                        } else {
                          setSelectedTeachers(selectedTeachers.filter((id) => id !== teacher.id));
                        }
                      }}
                    >
                      {teacher.firstname} {teacher.surname}
                    </Checkbox>
                  ))}
                </Stack>
              </Box>
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
