import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center } from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';

interface Child {
  id: number;
  firstname: string;
  surname: string;
  date_of_birth: string;
  parent_name: string;
  contact: string;
  notes: string;
}

interface ChildrenTableProps {
  data: Child[];
  loading?: boolean;
}

// Helper function to calculate age
const calculateAge = (dateOfBirth: string) => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

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
            <Th>{texts.childrenTable.firstname[language]}</Th>
            <Th>{texts.childrenTable.surname[language]}</Th>
            <Th>{texts.childrenTable.age[language]}</Th>
            <Th>{texts.childrenTable.parent[language]}</Th>
            <Th>{texts.childrenTable.contact[language]}</Th>
            <Th>{texts.childrenTable.notes[language]}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((child) => (
            <Tr key={child.id}>
              <Td>{child.firstname}</Td>
              <Td>{child.surname}</Td>
              <Td>{calculateAge(child.date_of_birth)}</Td>
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
