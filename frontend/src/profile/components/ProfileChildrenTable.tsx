import { Table, Thead, Tbody, Tr, Th, TableContainer } from '@chakra-ui/react';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { ReactNode } from 'react';

interface ProfileChildrenTableProps {
  children: ReactNode;
}

const ProfileChildrenTable = ({ children }: ProfileChildrenTableProps) => {
  const { language } = useLanguage();

  return (
    <TableContainer>
      <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
        <Thead>
          <Tr>
            <Th whiteSpace="nowrap">{texts.common.childrenTable.firstname[language]}</Th>
            <Th whiteSpace="nowrap">{texts.common.childrenTable.surname[language]}</Th>
            <Th whiteSpace="nowrap">{texts.common.childrenTable.age[language]}</Th>
            <Th whiteSpace="nowrap">{texts.common.childrenTable.notes[language]}</Th>
          </Tr>
        </Thead>
        <Tbody>{children}</Tbody>
      </Table>
    </TableContainer>
  );
};

export default ProfileChildrenTable;
