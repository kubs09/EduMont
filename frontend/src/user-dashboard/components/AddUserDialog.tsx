import React from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  useToast,
} from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import api from '@frontend/services/apiConfig';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ isOpen, onClose, onUserAdded }) => {
  const { language } = useLanguage();
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'admin' | 'teacher' | 'parent'>('teacher');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/api/users', { email, role, language });
      toast({
        title: texts.userDashboard.success[language],
        status: 'success',
        duration: 3000,
      });
      onUserAdded();
      onClose();
      setEmail('');
      setRole('teacher');
    } catch (error: unknown) {
      interface ApiError extends Error {
        response?: {
          data: {
            error?: string;
          };
        };
      }
      const errorResponse =
        error instanceof Error && 'response' in error ? (error as ApiError).response?.data : null;
      let errorMessage = texts.userDashboard.errorTitle[language];

      if (errorResponse?.error === 'user_exists') {
        errorMessage = texts.userDashboard.userExists[language];
      } else if (errorResponse?.error === 'invitation_exists') {
        errorMessage = texts.userDashboard.invitationExists[language];
      }

      toast({
        title: errorMessage,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>{texts.userDashboard.addUser[language]}</ModalHeader>
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>{texts.userDashboard.emailLabel[language]}</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>{texts.userDashboard.roleLabel[language]}</FormLabel>
            <Select
              value={role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setRole(e.target.value as 'admin' | 'teacher' | 'parent')
              }
            >
              <option value="admin">{texts.userTable.roles.admin[language]}</option>
              <option value="teacher">{texts.userTable.roles.teacher[language]}</option>
              <option value="parent">{texts.userTable.roles.parent[language]}</option>
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.userDashboard.cancel[language]}
          </Button>
          <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
            {texts.userDashboard.submit[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddUserDialog;
