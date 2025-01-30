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
} from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';

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
}

const UserTable: React.FC<UserTableProps> = ({ data, loading = false, error = null }) => {
  const { language } = useLanguage();

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
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>{texts.userTable.name[language]}</Th>
            <Th>{texts.userTable.email[language]}</Th>
            <Th>{texts.userTable.role[language]}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((user) => (
            <Tr key={user.id}>
              <Td>{`${user.firstname} ${user.surname}`}</Td>
              <Td>{user.email}</Td>
              <Td>{user.role}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default UserTable;
