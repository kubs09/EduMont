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
  Text,
} from '@chakra-ui/react';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';

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

  const groupUsersByClass = (users: User[], role: string) => {
    const roleUsers = users.filter((u) => u.role === role);
    const noClassUsers = roleUsers.filter((u) => !u.class_ids || u.class_ids.length === 0);
    const classUsers = roleUsers.filter((u) => u.class_ids && u.class_ids.length > 0);

    // Group users by class
    const classMaps = new Map<string, User[]>();
    classUsers.forEach((user) => {
      const classes = user.class_names?.split(', ') || [];
      classes.forEach((className) => {
        if (!classMaps.has(className)) {
          classMaps.set(className, []);
        }
        classMaps.get(className)?.push(user);
      });
    });

    return {
      noClassUsers,
      classGroups: Array.from(classMaps.entries()).map(([className, users]) => ({
        className,
        users,
      })),
    };
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
                      maxH="300px"
                      overflowY="auto"
                      w="100%"
                      p={2}
                      borderWidth={1}
                      borderRadius="md"
                    >
                      {['admin', 'teacher', 'parent'].map(
                        (role: 'admin' | 'teacher' | 'parent') => {
                          const { noClassUsers, classGroups } = groupUsersByClass(users, role);
                          if (noClassUsers.length === 0 && classGroups.length === 0) return null;

                          return (
                            <Box key={role} mb={4}>
                              <Text fontWeight="bold" mb={2} color="gray.600">
                                {t.roleGroups[role][language]}
                              </Text>

                              {noClassUsers.length > 0 && (
                                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2} mb={2}>
                                  {noClassUsers.map((user) => (
                                    <UserCheckbox
                                      key={user.id}
                                      user={user}
                                      isChecked={value.includes(user.id)}
                                      onChange={onChange}
                                      value={value}
                                    />
                                  ))}
                                </SimpleGrid>
                              )}

                              {classGroups.map(({ className, users }) => (
                                <Box key={className} ml={4} mb={3}>
                                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                                    {className}
                                  </Text>
                                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2}>
                                    {users.map((user) => (
                                      <UserCheckbox
                                        key={user.id}
                                        user={user}
                                        isChecked={value.includes(user.id)}
                                        onChange={onChange}
                                        value={value}
                                      />
                                    ))}
                                  </SimpleGrid>
                                </Box>
                              ))}
                            </Box>
                          );
                        }
                      )}
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

interface UserCheckboxProps {
  user: User;
  isChecked: boolean;
  onChange: (value: number[]) => void;
  value: number[];
}

const UserCheckbox: React.FC<UserCheckboxProps> = ({ user, isChecked, onChange, value }) => (
  <Checkbox
    isChecked={isChecked}
    onChange={(e) => {
      const newValue = e.target.checked
        ? [...value, user.id]
        : value.filter((id: number) => id !== user.id);
      onChange(newValue);
    }}
  >
    <Text>
      {user.firstname} {user.surname}
    </Text>
  </Checkbox>
);

export default ComposeMessageModal;
