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
import { useState } from 'react';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { Teacher } from '../../types/teacher';

interface Child {
  id: number;
  firstname: string;
  surname: string;
}

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: Teacher[];
  children: Child[];
}

interface ManageClassMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
  availableTeachers: Teacher[];
  availableChildren: Child[];
  onSave: (teacherIds: number[], childrenIds: number[]) => Promise<void>;
}

const ScrollableSection = ({ children }: { children: React.ReactNode }) => (
  <Box
    border="1px solid"
    borderColor="gray.200"
    borderRadius="md"
    height="200px"
    overflowY="auto"
    p={2}
  >
    {children}
  </Box>
);

export const ManageClassMembersModal = ({
  isOpen,
  onClose,
  classData,
  availableTeachers,
  availableChildren,
  onSave,
}: ManageClassMembersModalProps) => {
  const { language } = useLanguage();
  const [selectedTeachers, setSelectedTeachers] = useState(classData.teachers.map((t) => t.id));
  const [selectedChildren, setSelectedChildren] = useState(classData.children.map((c) => c.id));

  const handleSave = async () => {
    await onSave(selectedTeachers, selectedChildren);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.classes.manageClassTitle[language]}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text mb={2} fontWeight="medium">
                {texts.classes.teachers[language]}
              </Text>
              <ScrollableSection>
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
              </ScrollableSection>
            </Box>
            <Box>
              <Text mb={2} fontWeight="medium">
                {texts.classes.children[language]}
              </Text>
              <ScrollableSection>
                <Stack spacing={2}>
                  {availableChildren.map((child) => (
                    <Checkbox
                      key={child.id}
                      isChecked={selectedChildren.includes(child.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChildren([...selectedChildren, child.id]);
                        } else {
                          setSelectedChildren(selectedChildren.filter((id) => id !== child.id));
                        }
                      }}
                    >
                      {child.firstname} {child.surname}
                    </Checkbox>
                  ))}
                </Stack>
              </ScrollableSection>
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
