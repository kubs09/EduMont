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
  HStack,
  Checkbox,
  Stack,
  BoxProps,
} from '@chakra-ui/react';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';

interface Teacher {
  id: number;
  firstname: string;
  surname: string;
  role: string; // Add this line
}

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

interface ManageClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class;
  availableTeachers: Teacher[];
  availableChildren: Child[];
  onSave: (classId: number, teacherIds: number[], childrenIds: number[]) => Promise<void>;
  onClassUpdate: (updatedClass: Class) => void;
}

const ScrollableCheckboxGroup = (props: BoxProps) => (
  <Box
    border="1px solid"
    borderColor="gray.200"
    borderRadius="md"
    height="200px"
    overflowY="auto"
    p={2}
    {...props}
  />
);

export const ManageClassModal = ({
  isOpen,
  onClose,
  selectedClass,
  availableTeachers,
  availableChildren,
  onSave,
  onClassUpdate,
}: ManageClassModalProps) => {
  const { language } = useLanguage();

  const teachers = availableTeachers.filter((teacher) => teacher.role === 'teacher');

  const isValid = selectedClass.teachers.length > 0 && selectedClass.children.length > 0;

  const handleTeacherChange = (teacherId: number) => {
    const isSelected = selectedClass.teachers.some((t) => t.id === teacherId);
    const updatedTeachers = isSelected
      ? selectedClass.teachers.filter((t) => t.id !== teacherId)
      : [
          ...selectedClass.teachers,
          availableTeachers.find((t) => t.id === teacherId) ?? availableTeachers[0],
        ];

    onClassUpdate({
      ...selectedClass,
      teachers: updatedTeachers,
    });
  };

  const handleChildrenChange = (childId: number) => {
    const isSelected = selectedClass.children.some((c) => c.id === childId);
    const updatedChildren = isSelected
      ? selectedClass.children.filter((c) => c.id !== childId)
      : [
          ...selectedClass.children,
          availableChildren.find((c) => c.id === childId) ?? availableChildren[0],
        ];

    onClassUpdate({
      ...selectedClass,
      children: updatedChildren,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          {texts.classes.manageClass[language]}: {selectedClass.name}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody overflow="auto">
          <VStack spacing={4} align="stretch">
            <Box>
              <Text mb={2} fontWeight="medium">
                {texts.classes.teachers[language]}
              </Text>
              {selectedClass.teachers.length === 0 && (
                <Text color="red.500" fontSize="sm" mb={2}>
                  {texts.classes.validation.teacherRequired[language]}
                </Text>
              )}
              <ScrollableCheckboxGroup>
                <Stack spacing={2}>
                  {teachers.map((teacher) => (
                    <Checkbox
                      key={teacher.id}
                      isChecked={selectedClass.teachers.some((t) => t.id === teacher.id)}
                      onChange={() => handleTeacherChange(teacher.id)}
                    >
                      {teacher.firstname} {teacher.surname}
                    </Checkbox>
                  ))}
                </Stack>
              </ScrollableCheckboxGroup>
            </Box>
            <Box>
              <Text mb={2} fontWeight="medium">
                {texts.classes.children[language]}
              </Text>
              {selectedClass.children.length === 0 && (
                <Text color="red.500" fontSize="sm" mb={2}>
                  {texts.classes.validation.childRequired[language]}
                </Text>
              )}
              <ScrollableCheckboxGroup>
                <Stack spacing={2}>
                  {availableChildren.map((child) => (
                    <Checkbox
                      key={child.id}
                      isChecked={selectedClass.children.some((c) => c.id === child.id)}
                      onChange={() => handleChildrenChange(child.id)}
                    >
                      {child.firstname} {child.surname}
                    </Checkbox>
                  ))}
                </Stack>
              </ScrollableCheckboxGroup>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter position="sticky" bottom={0} bg="white" borderTop="1px" borderColor="gray.100">
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              {texts.classes.cancel[language]}
            </Button>
            <Button
              colorScheme="blue"
              onClick={() =>
                onSave(
                  selectedClass.id,
                  selectedClass.teachers.map((t) => t.id),
                  selectedClass.children.map((c) => c.id)
                )
              }
              isDisabled={!isValid}
            >
              {texts.classes.saveChanges[language]}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
