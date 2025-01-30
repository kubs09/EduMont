import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center } from '@chakra-ui/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { texts } from '../../texts';

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
  const { language } = useLanguage();

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
            <Th>{texts.childrenTable.name[language]}</Th>
            <Th>{texts.childrenTable.age[language]}</Th>
            <Th>{texts.childrenTable.parent[language]}</Th>
            <Th>{texts.childrenTable.contact[language]}</Th>
            <Th>{texts.childrenTable.notes[language]}</Th>
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
