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
import { useEffect, useMemo, useState } from 'react';
import { createChild } from '@frontend/services/api';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { createChildSchema } from '@frontend/profile/schemas/childSchema';
import DatePicker from '@frontend/shared/components/DatePicker/components/DatePicker';
import { getUsers } from '@frontend/services/api/user';
import { User } from '@frontend/types/shared';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

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

      const userId = parseInt(localStorage.getItem('userId') || '0');
      if (!userId) throw new Error('No user ID found');

      await createChild({
        ...formData,
        parent_ids: isAdmin ? selectedParentIds : [userId],
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

        toast({
          title: isNoSuitableClass
            ? texts.profile.children.noSuitableClass.title[language]
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
          <FormControl isRequired isInvalid={!!errors.date_of_birth} mb={4}>
            <FormLabel>{texts.profile.children.dateOfBirth[language]}</FormLabel>
            <DatePicker
              viewType="day"
              value={formData.date_of_birth}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  date_of_birth: date,
                }))
              }
              language={language}
            />
            <FormErrorMessage>{errors.date_of_birth}</FormErrorMessage>
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
            {texts.profile.children.addChild.submit[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddChildModal;
