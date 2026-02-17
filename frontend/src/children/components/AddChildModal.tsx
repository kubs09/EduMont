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
import { useEffect, useMemo, useState, useCallback } from 'react';
import { createChild } from '@frontend/services/api';
import { getClassesByAge } from '@frontend/services/api/class';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { createChildSchema } from '@frontend/profile/schemas/childSchema';
import DatePicker from '@frontend/shared/components/DatePicker/components/DatePicker';
import { getUsers } from '@frontend/services/api/user';
import { User } from '@frontend/types/shared';
import { Class } from '@frontend/types/class';
import { Combobox } from '@frontend/shared/components/Combobox';
interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  firstname: string;
  surname: string;
  date_of_birth: string;
  notes?: string;
}

const AddChildModal = ({ isOpen, onClose, onSuccess }: AddChildModalProps) => {
  const { language } = useLanguage();
  const toast = useToast();
  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    surname: '',
    date_of_birth: '',
    notes: '',
  });
  const [parents, setParents] = useState<User[]>([]);
  const [selectedParentIds, setSelectedParentIds] = useState<number[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

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
        setSelectedClassId(null);
        return;
      }

      setIsLoadingClasses(true);
      const classes = await getClassesByAge(age);
      setAvailableClasses(classes);

      // Auto-select the first available class
      if (classes.length > 0) {
        setSelectedClassId(classes[0].id);
      } else {
        setSelectedClassId(null);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setAvailableClasses([]);
      setSelectedClassId(null);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !isAdmin) return;

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
  }, [isOpen, isAdmin, language, toast]);

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

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      date_of_birth: date,
    }));
    if (date) {
      fetchAvailableClasses(date);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      if (isAdmin && selectedParentIds.length === 0) {
        setErrors({ parent_ids: texts.profile.error[language] });
        setIsSubmitting(false);
        return;
      }

      const schema = createChildSchema(language);
      schema.parse(formData);

      if (!selectedClassId) {
        setErrors({ class_id: 'Please select a class' });
        setIsSubmitting(false);
        return;
      }

      const userId = parseInt(localStorage.getItem('userId') || '0');
      if (!userId) throw new Error('No user ID found');

      await createChild({
        ...formData,
        parent_ids: isAdmin ? selectedParentIds : [userId],
        class_id: selectedClassId,
      });

      onSuccess();
      onClose();
    } catch (error) {
      if (error.errors) {
        const validationErrors: Record<string, string> = {};
        error.errors.forEach((err: { path: string[]; message: string }) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
      } else {
        const isNoSuitableClass =
          error.message === 'noSuitableClass' || error.message.includes('No suitable class');
        const isSelectedClassNotSuitable =
          error.message === 'selectedClassNotSuitable' || error.message.includes('not suitable');

        toast({
          title: isNoSuitableClass
            ? texts.profile.children.noSuitableClass.title[language]
            : isSelectedClassNotSuitable
              ? 'Class not suitable'
              : texts.profile.children.addChild.error[language],
          description: isNoSuitableClass
            ? texts.profile.children.noSuitableClass.description[language]
            : error.message,
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
          <FormControl isRequired isInvalid={!!errors.date_of_birth} mb={4}>
            <FormLabel>{texts.profile.children.dateOfBirth[language]}</FormLabel>
            <DatePicker
              viewType="day"
              value={formData.date_of_birth}
              onChange={handleDateChange}
              language={language}
            />
            <FormErrorMessage>{errors.date_of_birth}</FormErrorMessage>
          </FormControl>
          {formData.date_of_birth && (
            <FormControl isRequired isInvalid={!!errors.class_id} mb={4}>
              <FormLabel>{texts.schedule.class[language]}</FormLabel>
              {isLoadingClasses ? (
                <Box p={2}>Loading available classes...</Box>
              ) : availableClasses.length > 0 ? (
                <Select
                  value={selectedClassId ? selectedClassId.toString() : ''}
                  onChange={(e) =>
                    setSelectedClassId(e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder={texts.classes.selectClass[language]}
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
          )}
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
            {texts.profile.children.addChild.submit[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddChildModal;
