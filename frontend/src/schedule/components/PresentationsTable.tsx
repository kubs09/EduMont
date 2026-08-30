import React, { useEffect, useState } from 'react';
import { Table, IconButton, HStack, Text, Badge, Box } from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { Presentation } from '@frontend/types/presentation';
import { TablePagination } from '@frontend/shared/components';

interface PresentationTableProps {
  presentations: Presentation[];
  onEdit?: (presentation: Presentation) => void;
  onDelete?: (presentation: Presentation) => void;
  canEdit?: boolean;
  showChild?: boolean;
  showClass?: boolean;
}

const PresentationTable: React.FC<PresentationTableProps> = ({
  presentations,
  onEdit,
  onDelete,
  canEdit = false,
  showChild = true,
  showClass = true,
}) => {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  const totalPages = Math.ceil(presentations.length / PAGE_SIZE);
  const paginatedpresentations = presentations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'prerequisites not met':
        return 'red';
      case 'to be presented':
        return 'orange';
      case 'presented':
        return 'blue';
      case 'practiced':
        return 'teal';
      case 'mastered':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'prerequisites not met':
        return texts.schedule.status.options.prerequisitesNotMet[language];
      case 'to be presented':
        return texts.schedule.status.options.toBePresented[language];
      case 'presented':
        return texts.schedule.status.options.presented[language];
      case 'practiced':
        return texts.schedule.status.options.practiced[language];
      case 'mastered':
        return texts.schedule.status.options.mastered[language];
      default:
        return status;
    }
  };

  if (presentations.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="text-muted">{texts.schedule.noEntries[language]}</Text>
      </Box>
    );
  }

  return (
    <Table.ScrollArea>
      <Table.Root variant="simple" size="md">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{texts.schedule.name[language]}</Table.ColumnHeader>
            <Table.ColumnHeader>{texts.schedule.category[language]}</Table.ColumnHeader>
            <Table.ColumnHeader>{texts.schedule.status.label[language]}</Table.ColumnHeader>
            {showChild && <Table.ColumnHeader>{texts.schedule.child[language]}</Table.ColumnHeader>}
            {showClass && <Table.ColumnHeader>{texts.schedule.class[language]}</Table.ColumnHeader>}
            <Table.ColumnHeader>{texts.schedule.notes[language]}</Table.ColumnHeader>
            {canEdit && <Table.ColumnHeader>{texts.common.actions[language]}</Table.ColumnHeader>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {paginatedpresentations.map((presentation) => (
            <Table.Row key={presentation.id}>
              <Table.Cell>
                <Text fontWeight="medium">{presentation.name}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text>{presentation.category || '-'}</Text>
              </Table.Cell>
              <Table.Cell>
                <Badge
                  colorPalette={getStatusColor(presentation.status)}
                  variant="subtle"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {getStatusText(presentation.status)}
                </Badge>
              </Table.Cell>
              {showChild && (
                <Table.Cell>
                  <Text>
                    {presentation.child_firstname} {presentation.child_surname}
                  </Text>
                </Table.Cell>
              )}
              {showClass && (
                <Table.Cell>
                  <Text>{presentation.class_name}</Text>
                </Table.Cell>
              )}
              <Table.Cell>
                <Text
                  maxW="250px"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  title={presentation.notes}
                >
                  {presentation.notes || '-'}
                </Text>
              </Table.Cell>
              {canEdit && (
                <Table.Cell>
                  <HStack gap={2}>
                    <IconButton
                      aria-label={texts.schedule.editEntry[language]}
                      size="sm"
                      color="fg-brand"
                      variant="ghost"
                      onClick={() => onEdit?.(presentation)}
                    >
                      <FiEdit2 />
                    </IconButton>
                    <IconButton
                      aria-label={texts.schedule.deleteEntry[language]}
                      size="sm"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => onDelete?.(presentation)}
                    >
                      <FiTrash2 />
                    </IconButton>
                  </HStack>
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={PAGE_SIZE}
        totalCount={presentations.length}
      />
    </Table.ScrollArea>
  );
};

export default PresentationTable;
