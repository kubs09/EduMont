import { Table } from '@chakra-ui/react';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { ReactNode } from 'react';

interface ProfileChildrenTableProps {
  children: ReactNode;
}

const ProfileChildrenTable = ({ children }: ProfileChildrenTableProps) => {
  const { language } = useLanguage();

  return (
    <Table.ScrollArea>
      <Table.Root variant="line" size={{ base: 'sm', md: 'md' }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader whiteSpace="nowrap">
              {texts.common.childrenTable.firstname[language]}
            </Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">
              {texts.common.childrenTable.surname[language]}
            </Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">
              {texts.common.childrenTable.age[language]}
            </Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">
              {texts.common.childrenTable.notes[language]}
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>{children}</Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
};

export default ProfileChildrenTable;
