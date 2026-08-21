import React from 'react';
import { Button, Input, NativeSelect, Field, Dialog, Portal } from '@chakra-ui/react';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import api from '@frontend/services/apiConfig';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

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
  const toast = useAppToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/api/users', { email, role, language });
      toast({
        title: texts.userDashboard.success.created[language],
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
      let errorMessage = texts.userDashboard.errors.createFailed[language];

      if (errorResponse?.error === 'user_exists') {
        errorMessage = texts.userDashboard.errors.userExists[language];
      } else if (errorResponse?.error === 'invitation_exists') {
        errorMessage = texts.userDashboard.errors.invitationExists[language];
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
    <Dialog.Root open={isOpen} onOpenChange={e => {
      if (!e.open) {
        onClose();
      }
    }}>
      <Portal>

        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content as="form" onSubmit={handleSubmit}>
            <Dialog.Header>{texts.userDashboard.addUser[language]}</Dialog.Header>
            <Dialog.Body>
              <Field.Root required>
                <Field.Label>{texts.userDashboard.emailLabel[language]}</Field.Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </Field.Root>
              <Field.Root mt={4} required>
                <Field.Label>{texts.userDashboard.roleLabel[language]}</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={role}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setRole(e.target.value as 'admin' | 'teacher' | 'parent')
                    }>
                    <option value="admin">{texts.userDashboard.table.roles.admin[language]}</option>
                    <option value="teacher">{texts.userDashboard.table.roles.teacher[language]}</option>
                    <option value="parent">{texts.userDashboard.table.roles.parent[language]}</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={onClose}>
                {texts.common.cancel[language]}
              </Button>
              <Button colorPalette="blue" type="submit" loading={isSubmitting}>
                {texts.userDashboard.submit[language]}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default AddUserDialog;
