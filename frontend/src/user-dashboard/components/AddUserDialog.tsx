import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, NativeSelect, Field } from '@chakra-ui/react';
import { CustomModal } from '@frontend/shared/ui/modal';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import api from '@frontend/services/apiConfig';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';
import { createUserSchema, UserFormData } from '@frontend/shared/validation/userSchema';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ isOpen, onClose, onUserAdded }) => {
  const { language } = useLanguage();
  const toast = useAppToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(createUserSchema(language)),
    defaultValues: { email: '', role: 'teacher' },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      await api.post('/api/users', { email: data.email, role: data.role, language });
      toast({
        title: texts.userDashboard.success.created[language],
        status: 'success',
        duration: 3000,
      });
      onUserAdded();
      onClose();
      reset({ email: '', role: 'teacher' });
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
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title={texts.userDashboard.addUser[language]}
      buttons={
        <>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button variant="brand" type="submit" loading={isSubmitting}>
            {texts.userDashboard.submit[language]}
          </Button>
        </>
      }
    >
      <Field.Root required invalid={!!errors.email}>
        <Field.Label>{texts.userDashboard.emailLabel[language]}</Field.Label>
        <Input type="email" placeholder="email@example.com" {...register('email')} />
        <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
      </Field.Root>
      <Field.Root mt={4} required invalid={!!errors.role}>
        <Field.Label>{texts.userDashboard.roleLabel[language]}</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field {...register('role')}>
            <option value="admin">{texts.userDashboard.table.roles.admin[language]}</option>
            <option value="teacher">{texts.userDashboard.table.roles.teacher[language]}</option>
            <option value="parent">{texts.userDashboard.table.roles.parent[language]}</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Field.ErrorText>{errors.role?.message}</Field.ErrorText>
      </Field.Root>
    </CustomModal>
  );
};

export default AddUserDialog;
