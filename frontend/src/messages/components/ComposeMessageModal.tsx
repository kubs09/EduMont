import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Textarea, VStack, Field } from '@chakra-ui/react';
import { CustomModal } from '@frontend/shared/ui/modal';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { createMessageSchema, MessageFormData } from '../schemas/MessageSchema';
import { Select } from '@frontend/shared/components';
import { User } from '@frontend/types/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { to_user_ids: number[]; subject: string; content: string }) => Promise<void>;
  users: User[];
}

export const ComposeMessageModal: React.FC<Props> = ({ isOpen, onClose, onSend, users }) => {
  const { language } = useLanguage();
  const t = texts.messages;
  const messageSchema = createMessageSchema(language as 'en' | 'cs');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      to_user_ids: [],
      subject: '',
      content: '',
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    await onSend(data);
    reset();
    onClose();
  };

  const getAllUsers = () => {
    return users.map((u) => u.id);
  };

  const getTeacherParents = () => {
    return users.filter((u) => u.role === 'parent').map((p) => p.id);
  };

  const buildComboboxOptions = () => {
    const options: Array<{ value: string | number; label: string }> = [];

    if (currentUser.role === 'admin') {
      options.push({
        value: 'ALL_USERS',
        label: `${t.allUsers[language]} (${users.length})`,
      });
    } else if (currentUser.role === 'teacher') {
      const parentCount = getTeacherParents().length;
      options.push({
        value: 'ALL_PARENTS_IN_CLASS',
        label: `${t.allParentsInClass[language]} (${parentCount})`,
      });
    }

    users.forEach((user) => {
      options.push({
        value: user.id,
        label: `${user.firstname} ${user.surname} (${user.role}${
          user.class_names ? ` - ${user.class_names}` : ''
        })`,
      });
    });

    return options;
  };

  const handleComboboxChange = (newValue: string | number | Array<string | number> | null) => {
    if (!Array.isArray(newValue)) return;

    let finalValue = [...newValue];

    if (newValue.includes('ALL_USERS')) {
      finalValue = finalValue.filter((val) => val !== 'ALL_USERS');
      finalValue.push(...getAllUsers());
    } else if (newValue.includes('ALL_PARENTS_IN_CLASS')) {
      finalValue = finalValue.filter((val) => val !== 'ALL_PARENTS_IN_CLASS');
      finalValue.push(...getTeacherParents());
    }

    const uniqueValue = Array.from(new Set(finalValue));
    const filteredValue = uniqueValue.filter((val) => typeof val === 'number');

    return filteredValue;
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: 'full', md: 'xl' }}
      onSubmit={handleSubmit(onSubmit)}
      contentProps={{ maxWidth: { base: '100%', md: '800px' }, m: { base: 0, md: 4 } }}
      title={t.compose[language]}
      buttons={
        <>
          <Button mr={3} onClick={onClose} variant="secondary">
            {texts.common.cancel[language]}
          </Button>
          <Button type="submit" variant="brand" loading={isSubmitting}>
            {t.send[language]}
          </Button>
        </>
      }
    >
      <VStack gap={4}>
        <Field.Root invalid={!!errors.to_user_ids}>
          <Field.Label>{t.to[language]}</Field.Label>
          <Controller
            name="to_user_ids"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Select
                options={buildComboboxOptions()}
                value={value}
                onChange={(newValue) => {
                  const expanded = handleComboboxChange(newValue);
                  onChange(expanded || []);
                }}
                placeholder={t.recipients[language]}
                isMulti
              />
            )}
          />
          <Field.ErrorText>{errors.to_user_ids?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.subject}>
          <Field.Label>{t.subject[language]}</Field.Label>
          <Controller
            name="subject"
            control={control}
            render={({ field }) => <Input variant="subtle" {...field} />}
          />
          <Field.ErrorText>{errors.subject?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.content}>
          <Field.Label>{t.content[language]}</Field.Label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => <Textarea variant="subtle" rows={4} {...field} />}
          />
          <Field.ErrorText>{errors.content?.message}</Field.ErrorText>
        </Field.Root>
      </VStack>
    </CustomModal>
  );
};

export default ComposeMessageModal;
