import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center } from '@chakra-ui/react';

interface Child {
  id: number;
  name: string;
  age: number;
  class: string;
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
            <Th>Name</Th>
            <Th>Age</Th>
            <Th>Class</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((child) => (
            <Tr key={child.id}>
              <Td>{child.name}</Td>
              <Td>{child.age}</Td>
              <Td>{child.class}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default ChildrenTable;
