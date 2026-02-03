import React from 'react';
import { HStack, IconButton, Button, Text } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalCount?: number;
  isDisabled?: boolean;
}

export const DEFAULT_PAGE_SIZE = 3;

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalCount,
  isDisabled = false,
}) => {
  const { language } = useLanguage();

  if (totalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const canGoPrevious = safeCurrentPage > 1 && !isDisabled;
  const canGoNext = safeCurrentPage < totalPages && !isDisabled;

  const startRecord = totalCount && pageSize ? (safeCurrentPage - 1) * pageSize + 1 : undefined;
  const endRecord =
    totalCount && pageSize ? Math.min(safeCurrentPage * pageSize, totalCount) : undefined;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <HStack justifyContent="space-between" mt={4} spacing={4} flexWrap="wrap">
      <HStack spacing={1}>
        <IconButton
          aria-label="Previous page"
          icon={<ChevronLeftIcon />}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          isDisabled={!canGoPrevious}
        />
        {pages.map((page) => (
          <Button
            key={page}
            size="sm"
            variant={page === safeCurrentPage ? 'solid' : 'ghost'}
            colorScheme={page === safeCurrentPage ? 'blue' : 'gray'}
            onClick={() => onPageChange(page)}
            isDisabled={isDisabled}
          >
            {page}
          </Button>
        ))}
        <IconButton
          aria-label="Next page"
          icon={<ChevronRightIcon />}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          isDisabled={!canGoNext}
        />
      </HStack>
      {startRecord && endRecord && totalCount && (
        <Text fontSize="sm" color="gray.500">
          {texts.pagination.showing[language]} {startRecord}-{endRecord}{' '}
          {texts.pagination.ofPage[language]} {totalCount}
        </Text>
      )}
      {!startRecord && (
        <Text fontSize="sm" color="gray.500">
          {texts.pagination.page[language]} {safeCurrentPage} {texts.pagination.ofPage[language]}{' '}
          {totalPages}
        </Text>
      )}
    </HStack>
  );
};

export default TablePagination;
