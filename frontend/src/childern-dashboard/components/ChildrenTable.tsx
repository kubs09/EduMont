import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center } from '@chakra-ui/react';

interface Child {
  id: number;
  name: string;
  age: number;
  parent_name: string;
  contact: string;
  notes: string;
}

interface ChildrenTableProps {
  data: Child[];
  loading?: boolean;
}

const ChildrenTable: React.FC<ChildrenTableProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <Center p={8}>
        <Spinner />
      </Center>
    );
  }

  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Jméno</Th>
            <Th>Věk</Th>
            <Th>Rodič</Th>
            <Th>Kontakt na rodiče</Th>
            <Th>Poznámka</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((child) => (
            <Tr key={child.id}>
              <Td>{child.name}</Td>
              <Td>{child.age}</Td>
              <Td>{child.parent_name}</Td>
              <Td>{child.contact}</Td>
              <Td>{child.notes}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default ChildrenTable;
