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
  Select,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { editChildSchema } from '@frontend/profile/schemas/childSchema';
import { Child, UpdateChildData } from '@frontend/types/child';
import { getUsers } from '@frontend/services/api/user';
import { getClassesByAge } from '@frontend/services/api/class';
import { User } from '@frontend/types/shared';
import { Class } from '@frontend/types/class';
import { Combobox } from '@frontend/shared/components/Combobox';

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
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(childData.class_id || null);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchAvailableClasses = useCallback(async (dateOfBirth: string) => {
    try {
      const age = calculateAge(dateOfBirth);
      if (age === null || age < 0) {
        setAvailableClasses([]);
        return;
      }

      setIsLoadingClasses(true);
      const classes = await getClassesByAge(age);
      setAvailableClasses(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setAvailableClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    setFormData({
      firstname: childData.firstname,
      surname: childData.surname,
      notes: childData.notes || '',
    });
    setSelectedParentIds(childData.parents?.map((parent) => parent.id) || []);
    setSelectedClassId(childData.class_id || null);

    // Fetch available classes for the child's current age
    if (childData.date_of_birth) {
      fetchAvailableClasses(childData.date_of_birth);
    }
  }, [childData, fetchAvailableClasses]);

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
        class_id: selectedClassId || undefined,
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
        const isSelectedClassNotSuitable =
          error.message === 'selectedClassNotSuitable' || error.message.includes('not suitable');

        toast({
          title: isSelectedClassNotSuitable ? 'Class not suitable' : texts.profile.error[language],
          description: error.message,
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
              <Combobox
                options={parentOptions.map((parent) => ({
                  label: parent.label,
                  value: parent.id,
                }))}
                value={selectedParentIds}
                onChange={(values) =>
                  setSelectedParentIds(
                    Array.isArray(values) ? values.map((value) => Number(value)) : []
                  )
                }
                placeholder={texts.childrenTable.parent[language]}
                isMulti
                isDisabled={isLoadingParents}
              />
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
          <FormControl isInvalid={!!errors.class_id} mb={4}>
            <FormLabel>Class</FormLabel>
            {isLoadingClasses ? (
              <Box p={2}>Loading available classes...</Box>
            ) : availableClasses.length > 0 ? (
              <Select
                value={selectedClassId ? selectedClassId.toString() : ''}
                onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
                placeholder="Select a class"
                isDisabled={isLoadingClasses}
              >
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Ages {cls.min_age}-{cls.max_age})
                  </option>
                ))}
              </Select>
            ) : (
              <Box p={2} color="red.500">
                No suitable classes found for this age.
              </Box>
            )}
            <FormErrorMessage>{errors.class_id}</FormErrorMessage>
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
