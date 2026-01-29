import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Center,
  Text,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';

interface User {
  id: number;
  email: string;
  firstname: string;
  surname: string;
  role: 'admin' | 'teacher' | 'parent';
}

interface UserTableProps {
  data: User[];
  loading?: boolean;
  error?: string | null;
  onDelete: (userId: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({ data, loading = false, error = null, onDelete }) => {
  const { language } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      onDelete(selectedUser.id);
      onClose();
      setSelectedUser(null);
    }
  };

  if (loading) {
    return (
      <Center p={8}>
        <Spinner />
      </Center>
    );
  }

  if (error) {
    return (
      <Center p={8}>
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }

  return (
    <>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{texts.userTable.name[language]}</Th>
              <Th>{texts.userTable.email[language]}</Th>
              <Th>{texts.userTable.role[language]}</Th>
              <Th>{texts.userTable.actions[language]}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((user) => (
              <Tr key={user.id}>
                <Td>{`${user.firstname} ${user.surname}`}</Td>
                <Td>{user.email}</Td>
                <Td>{texts.userTable.roles[user.role][language]}</Td>
                <Td>
                  <IconButton
                    aria-label={texts.userTable.deleteButton[language]}
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDeleteClick(user)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {texts.userTable.deleteConfirmTitle[language]}
            </AlertDialogHeader>

            <AlertDialogBody>
              {texts.userTable.deleteConfirmMessage[language]}{' '}
              <strong>
                {selectedUser?.firstname} {selectedUser?.surname}
              </strong>
              ?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {texts.userDashboard.cancel[language]}
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                {texts.userTable.deleteButton[language]}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default UserTable;
