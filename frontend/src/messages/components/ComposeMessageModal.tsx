import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { createMessageSchema, MessageFormData } from '../schemas/MessageSchema';
import { Combobox } from '@frontend/shared/components';

interface User {
  id: number;
  firstname: string;
  surname: string;
  role: string;
  class_names?: string;
  class_ids?: number[];
}

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
        label: `${user.firstname} ${user.surname} (${user.role}${user.class_names ? ` - ${user.class_names}` : ''})`,
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
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'xl' }}>
      <ModalOverlay />
      <ModalContent maxWidth={{ base: '100%', md: '800px' }} m={{ base: 0, md: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>{t.compose[language]}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.to_user_ids}>
                <FormLabel>{t.to[language]}</FormLabel>
                <Controller
                  name="to_user_ids"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Combobox
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
                <FormErrorMessage>{errors.to_user_ids?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.subject}>
                <FormLabel>{t.subject[language]}</FormLabel>
                <Controller
                  name="subject"
                  control={control}
                  render={({ field }) => <Input variant="filled" {...field} />}
                />
                <FormErrorMessage>{errors.subject?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.content}>
                <FormLabel>{t.content[language]}</FormLabel>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => <Textarea variant="filled" rows={4} {...field} />}
                />
                <FormErrorMessage>{errors.content?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose} variant="secondary">
              {texts.classes.cancel[language]}
            </Button>
            <Button type="submit" variant="brand" isLoading={isSubmitting}>
              {t.send[language]}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ComposeMessageModal;
