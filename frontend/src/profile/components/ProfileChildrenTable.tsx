import { Table, Thead, Tbody, Tr, Th } from '@chakra-ui/react';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import { ReactNode } from 'react';

interface ProfileChildrenTableProps {
  children: ReactNode;
}

const ProfileChildrenTable = ({ children }: ProfileChildrenTableProps) => {
  const { language } = useLanguage();

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>{texts.childrenTable.firstname[language]}</Th>
          <Th>{texts.childrenTable.surname[language]}</Th>
          <Th>{texts.childrenTable.age[language]}</Th>
          <Th>{texts.childrenTable.notes[language]}</Th>
        </Tr>
      </Thead>
      <Tbody>{children}</Tbody>
    </Table>
  );
};

export default ProfileChildrenTable;
