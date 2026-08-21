import React, { useEffect } from 'react';
import { useColorModeValue } from "../../components/ui/color-mode";
import {
  Table,
  Spinner,
  Center,
  Text,
  IconButton,
  useDisclosure,
  Button,
  Link as ChakraLink,
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { FiTrash2 } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '@frontend/shared/route';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@frontend/shared/components';
import { User, UserTableProps } from '@frontend/types/user';

const UserTable: React.FC<UserTableProps> = ({ data, loading = false, error = null, onDelete }) => {
  const { language } = useLanguage();
  const { open, onOpen, onClose } = useDisclosure();
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedUsers = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      <Table.ScrollArea>
        <Table.Root variant="simple">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{texts.userDashboard.table.name[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.userDashboard.table.email[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.userDashboard.table.role[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.userDashboard.table.actions[language]}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedUsers.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>
                  <ChakraLink asChild color={linkColor}>
                    <RouterLink to={ROUTES.PROFILE_DETAIL.replace(':id', user.id.toString())}>
                      {`${user.firstname} ${user.surname}`}
                    </RouterLink>
                  </ChakraLink>
                </Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>{texts.userDashboard.table.roles[user.role][language]}</Table.Cell>
                <Table.Cell>
                  <IconButton
                    aria-label={texts.userDashboard.table.deleteButton[language]}
                    size="sm"
                    colorPalette="red"
                    variant="ghost"
                    onClick={() => handleDeleteClick(user)}><FiTrash2 /></IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={PAGE_SIZE}
          totalCount={data.length}
        />
      </Table.ScrollArea>

      <Dialog.Root
        open={open}
        initialFocusEl={() => cancelRef.current}
        role='alertdialog'
        onOpenChange={e => {
          if (!e.open) {
            onClose();
          }
        }}>
        <Portal>

          <Dialog.Backdrop>
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header fontSize="lg" fontWeight="bold">
                  {texts.userDashboard.table.deleteConfirmTitle[language]}
                </Dialog.Header>

                <Dialog.Body>
                  {texts.userDashboard.table.deleteConfirmMessage[language]}{' '}
                  <strong>
                    {selectedUser?.firstname} {selectedUser?.surname}
                  </strong>
                  ?
                </Dialog.Body>

                <Dialog.Footer>
                  <Button ref={cancelRef} onClick={onClose}>
                    {texts.common.cancel[language]}
                  </Button>
                  <Button colorPalette="red" onClick={handleConfirmDelete} ml={3}>
                    {texts.userDashboard.table.deleteButton[language]}
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Backdrop>

        </Portal>
</Dialog.Root>
    </>
  );
};

export default UserTable;
