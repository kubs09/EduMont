import React from 'react';
import { z } from 'zod';
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
  Checkbox,
  SimpleGrid,
  Box,
} from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';

interface User {
  id: number;
  firstname: string;
  surname: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { to_user_ids: number[]; subject: string; content: string }) => Promise<void>;
  users: User[];
}

const messageSchema = z.object({
  to_user_ids: z.array(z.number()).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Message content is required'),
});

type MessageFormData = z.infer<typeof messageSchema>;

export const ComposeMessageModal: React.FC<Props> = ({ isOpen, onClose, onSend, users }) => {
  const { language } = useLanguage();
  const t = texts.messages;

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
                    <Box
                      maxH="200px"
                      overflowY="auto"
                      w="100%"
                      p={2}
                      borderWidth={1}
                      borderRadius="md"
                    >
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2}>
                        {users.map((user) => (
                          <Checkbox
                            key={user.id}
                            isChecked={value.includes(user.id)}
                            onChange={(e) => {
                              const newValue = e.target.checked
                                ? [...value, user.id]
                                : value.filter((id: number) => id !== user.id);
                              onChange(newValue);
                            }}
                          >
                            {user.firstname} {user.surname}
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                />
                <FormErrorMessage>{errors.to_user_ids?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.subject}>
                <FormLabel>{t.subject[language]}</FormLabel>
                <Controller
                  name="subject"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
                <FormErrorMessage>{errors.subject?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.content}>
                <FormLabel>{t.content[language]}</FormLabel>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => <Textarea rows={4} {...field} />}
                />
                <FormErrorMessage>{errors.content?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              {texts.classes.cancel[language]}
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
              {t.send[language]}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ComposeMessageModal;
