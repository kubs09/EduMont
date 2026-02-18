import React, { useEffect, useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  HStack,
  Text,
  Badge,
  Box,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
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
        return (
          texts.presentation.status?.options.prerequisitesNotMet[language] ||
          'Prerequisites Not Met'
        );
      case 'to be presented':
        return texts.presentation.status?.options.toBePresented[language] || 'To Be Presented';
      case 'presented':
        return texts.presentation.status?.options.presented[language] || 'Presented';
      case 'practiced':
        return texts.presentation.status?.options.practiced[language] || 'Practiced';
      case 'mastered':
        return texts.presentation.status?.options.mastered[language] || 'Mastered';
      default:
        return status;
    }
  };

  if (presentations.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">{texts.presentation.noEntries[language]}</Text>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            <Th>{texts.presentation.name?.[language] || 'Name'}</Th>
            <Th>{texts.presentation.category?.[language] || 'Category'}</Th>
            <Th>{texts.presentation.status?.label?.[language] || 'Status'}</Th>
            {showChild && <Th>{texts.presentation.child[language]}</Th>}
            {showClass && <Th>{texts.presentation.class[language]}</Th>}
            <Th>{texts.presentation.notes[language]}</Th>
            {canEdit && <Th>{texts.common.actions[language]}</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {paginatedpresentations.map((presentation) => (
            <Tr key={presentation.id}>
              <Td>
                <Text fontWeight="medium">{presentation.name}</Text>
              </Td>
              <Td>
                <Text>{presentation.category || '-'}</Text>
              </Td>
              <Td>
                <Badge
                  colorScheme={getStatusColor(presentation.status)}
                  variant="subtle"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {getStatusText(presentation.status)}
                </Badge>
              </Td>
              {showChild && (
                <Td>
                  <Text>
                    {presentation.child_firstname} {presentation.child_surname}
                  </Text>
                </Td>
              )}
              {showClass && (
                <Td>
                  <Text>{presentation.class_name}</Text>
                </Td>
              )}
              <Td>
                <Text
                  maxW="250px"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  title={presentation.notes}
                >
                  {presentation.notes || '-'}
                </Text>
              </Td>
              {canEdit && (
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Edit presentation"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => onEdit?.(presentation)}
                    />
                    <IconButton
                      aria-label="Delete presentation"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => onDelete?.(presentation)}
                    />
                  </HStack>
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={PAGE_SIZE}
        totalCount={presentations.length}
      />
    </TableContainer>
  );
};

export default PresentationTable;
