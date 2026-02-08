import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  FormErrorMessage,
  useToast,
  Box,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { editChildSchema } from '@frontend/profile/schemas/childSchema';
import { Child, UpdateChildData } from '@frontend/types/child';
import { getUsers } from '@frontend/services/api/user';
import { User } from '@frontend/types/shared';

interface EditChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  childData: Child;
  onSave: (updatedData: UpdateChildData) => Promise<void>;
}

interface FormData {
  firstname: string;
  surname: string;
  notes?: string;
}

const EditChildModal = ({ isOpen, onClose, childData, onSave }: EditChildModalProps) => {
  const { language } = useLanguage();
  const toast = useToast();
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  const [formData, setFormData] = useState<FormData>({
    firstname: childData.firstname,
    surname: childData.surname,
    notes: childData.notes || '',
  });
  const [parents, setParents] = useState<User[]>([]);
  const [selectedParentIds, setSelectedParentIds] = useState<number[]>(
    childData.parents?.map((parent) => parent.id) || []
  );
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      firstname: childData.firstname,
      surname: childData.surname,
      notes: childData.notes || '',
    });
    setSelectedParentIds(childData.parents?.map((parent) => parent.id) || []);
  }, [childData]);

  useEffect(() => {
    if (!isAdmin || !isOpen) return;

    const fetchParents = async () => {
      try {
        setIsLoadingParents(true);
        const data = await getUsers('parent');
        setParents(data);
      } catch (error) {
        toast({
          title: texts.profile.error[language],
          description: error.message || 'Failed to fetch parents',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingParents(false);
      }
    };

    fetchParents();
  }, [isAdmin, isOpen, language, toast]);

  const parentOptions = useMemo(() => {
    return parents.map((parent) => ({
      id: parent.id,
      label: `${parent.firstname} ${parent.surname} (${parent.email})`,
    }));
  }, [parents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      const schema = editChildSchema(language);
      schema.parse(formData);

      if (isAdmin && selectedParentIds.length === 0) {
        setErrors({ parent_ids: texts.profile.error[language] });
        setIsSubmitting(false);
        return;
      }

      await onSave({
        id: childData.id,
        ...formData,
        parent_ids: isAdmin ? selectedParentIds : undefined,
      });
      onClose();
    } catch (error) {
      if (error.errors) {
        const validationErrors: Record<string, string> = {};
        error.errors.forEach((err: { path: string[]; message: string }) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
      } else {
        toast({
          title: texts.profile.error[language],
          description: error.message || 'Failed to update child',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.profile.children.addChild.title[language]}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isAdmin && (
            <FormControl isRequired isInvalid={!!errors.parent_ids} mb={4}>
              <FormLabel>{texts.childrenTable.parent[language]}</FormLabel>
              <Box maxH="180px" overflowY="auto" borderWidth="1px" borderRadius="md" p={2}>
                <CheckboxGroup
                  value={selectedParentIds.map((id) => id.toString())}
                  onChange={(values) => setSelectedParentIds(values.map((value) => Number(value)))}
                >
                  <Stack spacing={2}>
                    {parentOptions.map((parent) => (
                      <Checkbox
                        key={parent.id}
                        value={parent.id.toString()}
                        isDisabled={isLoadingParents}
                      >
                        {parent.label}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </Box>
              <FormErrorMessage>{errors.parent_ids}</FormErrorMessage>
            </FormControl>
          )}
          <FormControl isRequired isInvalid={!!errors.firstname} mb={4}>
            <FormLabel>{texts.childrenTable.firstname[language]}</FormLabel>
            <Input name="firstname" value={formData.firstname} onChange={handleChange} />
            <FormErrorMessage>{errors.firstname}</FormErrorMessage>
          </FormControl>
          <FormControl isRequired isInvalid={!!errors.surname} mb={4}>
            <FormLabel>{texts.childrenTable.surname[language]}</FormLabel>
            <Input name="surname" value={formData.surname} onChange={handleChange} />
            <FormErrorMessage>{errors.surname}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.notes} mb={4}>
            <FormLabel>{texts.childrenTable.notes[language]}</FormLabel>
            <Textarea name="notes" value={formData.notes} onChange={handleChange} />
            <FormErrorMessage>{errors.notes}</FormErrorMessage>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>
            {texts.common.save[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditChildModal;
