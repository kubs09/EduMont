import React, { useEffect } from 'react';
import {
  Table,
  Spinner,
  Center,
  Text,
  IconButton,
  useDisclosure,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@frontend/shared/components';
import { User, UserTableProps } from '@frontend/types/user';
import { CustomTable } from '@frontend/shared/ui/table';
import { CustomDialog } from '@frontend/shared/ui/dialog';
import { ROUTES } from '@frontend/shared/route';

const UserTable: React.FC<UserTableProps> = ({ data, loading = false, error = null, onDelete }) => {
  const { language } = useLanguage();
  const { open, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
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
        <Text color="text-danger">{error}</Text>
      </Center>
    );
  }

  return (
    <>
      <Table.ScrollArea>
        <CustomTable
          headers={[
            texts.userDashboard.table.name[language],
            texts.userDashboard.table.email[language],
            texts.userDashboard.table.role[language],
            texts.userDashboard.table.actions[language],
          ]}
          data={paginatedUsers.map((user) => [
            <ChakraLink key={user.id} asChild variant="underline">
              <RouterLink to={ROUTES.PROFILE_DETAIL.replace(':id', user.id.toString())}>
                {`${user.firstname} ${user.surname}`}
              </RouterLink>
            </ChakraLink>,
            user.email,
            texts.userDashboard.table.roles[user.role][language],
          ])}
          actions={(rowIndex) => (
            <IconButton
              aria-label={texts.userDashboard.table.deleteButton[language]}
              size="sm"
              colorPalette="red"
              variant="ghost"
              onClick={() => handleDeleteClick(paginatedUsers[rowIndex])}
            >
              <FiTrash2 />
            </IconButton>
          )}
        />
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={PAGE_SIZE}
          totalCount={data.length}
        />
      </Table.ScrollArea>
      <CustomDialog
        isOpen={open}
        onClose={onClose}
        onConfirm={() => {
          if (selectedUser) {
            onDelete(selectedUser.id);
          }
          setSelectedUser(null);
          onClose();
        }}
        title={texts.userDashboard.table.deleteConfirmTitle[language]}
        cancelLabel={texts.common.cancel[language]}
        confirmLabel={texts.common.confirm[language]}
      >
        {texts.userDashboard.table.deleteConfirmMessage[language]}{' '}
        <strong>
          {selectedUser?.firstname} {selectedUser?.surname}
        </strong>
      </CustomDialog>
    </>
  );
};

export default UserTable;
