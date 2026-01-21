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
} from '@chakra-ui/react';
import { useState } from 'react';
import { createChild } from '../../services/api';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { createChildSchema } from '../../profile/schemas/childSchema';
import DatePicker from '@frontend/shared/components/DatePicker/components/DatePicker';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const schema = createChildSchema(language);
      schema.parse(formData);

      const userId = parseInt(localStorage.getItem('userId') || '0');
      if (!userId) throw new Error('No user ID found');

      await createChild({
        ...formData,
        parent_id: userId,
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
