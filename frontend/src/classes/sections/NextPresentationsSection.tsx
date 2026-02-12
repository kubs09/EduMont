import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tabs,
  TabList,
  Tab,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { NextPresentation } from '@frontend/services/api/class';
import { Class } from '@frontend/types/class';
import TablePagination from '@frontend/shared/components/TablePagination/TablePagination';
import { ChildExcuse } from '@frontend/services/api/child';

interface PresentationsTabProps {
  classData: Class;
  nextPresentations: NextPresentation[];
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
  excusesByChildId: Record<number, ChildExcuse[]>;
}

const PresentationsTab: React.FC<PresentationsTabProps> = ({
  classData,
  nextPresentations,
  language,
  isAdmin,
  isTeacher,
  excusesByChildId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const PAGE_SIZE = 4;

  const isChildExcusedToday = (childId: number) => {
    const excuses = excusesByChildId[childId] || [];
    if (!excuses.length) return false;

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const parseDate = (value: string) => {
      const direct = new Date(value);
      if (!Number.isNaN(direct.getTime())) return direct;
      const fallback = new Date(`${value}T00:00:00`);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    return excuses.some((excuse) => {
      const fromDate = parseDate(excuse.date_from);
      const toDate = parseDate(excuse.date_to);
      if (!fromDate || !toDate) return false;
      return todayDate >= fromDate && todayDate <= toDate;
    });
  };

  const filteredPresentations = nextPresentations.filter(
    (presentation) =>
      presentation.status === 'to be presented' &&
      classData.children.some(
        (child) => child.id === presentation.child_id && !isChildExcusedToday(child.id)
      )
  );

  const uncategorizedLabel = language === 'cs' ? 'Bez kategorie' : 'Uncategorized';

  const categoryOptions = useMemo(() => {
    const options = filteredPresentations.map((presentation) =>
      presentation.category?.trim() ? presentation.category.trim() : uncategorizedLabel
    );
    return Array.from(new Set(options));
  }, [filteredPresentations, uncategorizedLabel]);

  useEffect(() => {
    if (categoryOptions.length === 0) {
      setActiveCategory(null);
      return;
    }

    if (!activeCategory || !categoryOptions.includes(activeCategory)) {
      setActiveCategory(categoryOptions[0]);
    }
  }, [activeCategory, categoryOptions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const categoryFilteredPresentations = activeCategory
    ? filteredPresentations.filter(
        (presentation) =>
          (presentation.category?.trim() ? presentation.category.trim() : uncategorizedLabel) ===
          activeCategory
      )
    : filteredPresentations;

  const visiblePresentations = categoryFilteredPresentations.reduce<NextPresentation[]>(
    (acc, presentation) => {
      if (acc.some((item) => item.child_id === presentation.child_id)) {
        return acc;
      }
      acc.push(presentation);
      return acc;
    },
    []
  );

  const totalPages = Math.ceil(visiblePresentations.length / PAGE_SIZE);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const paginatedPresentations = visiblePresentations.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  return (
    <Box>
      {visiblePresentations.length === 0 ? (
        <Text variant="empty">{texts.classes.detail.noNextPresentations[language]}</Text>
      ) : (
        <Box>
          {categoryOptions.length > 1 && (
            <Tabs
              index={Math.max(categoryOptions.indexOf(activeCategory || ''), 0)}
              onChange={(index) => setActiveCategory(categoryOptions[index])}
              variant="soft-rounded"
              colorScheme="blue"
              mb={4}
            >
              <TabList flexWrap="wrap" gap={2}>
                {categoryOptions.map((category) => (
                  <Tab
                    key={category}
                    _selected={{
                      bg: 'blue.500',
                      color: 'white',
                    }}
                    _hover={{
                      bg: { base: 'gray.200', _dark: 'gray.600' },
                    }}
                    bg={{ base: 'gray.100', _dark: 'gray.700' }}
                    color={{ base: 'gray.700', _dark: 'gray.200' }}
                  >
                    {category}
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          )}
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead>
                <Tr>
                  <Th>{texts.childrenTable.name[language]}</Th>
                  <Th>{texts.classes.detail.category[language]}</Th>
                  <Th>{texts.classes.detail.presentation[language]}</Th>
                  {(isAdmin || isTeacher) && <Th>{texts.classes.detail.notes[language]}</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {paginatedPresentations.map((presentation) => (
                  <Tr key={`${presentation.child_id}-${presentation.id}`}>
                    <Td>
                      {presentation.firstname} {presentation.surname}
                    </Td>
                    <Td>{presentation.category?.trim() || uncategorizedLabel}</Td>
                    <Td>{presentation.presentation || '-'}</Td>
                    {(isAdmin || isTeacher) && <Td>{presentation.notes || '-'}</Td>}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {visiblePresentations.length > 0 && (
        <TablePagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={PAGE_SIZE}
          totalCount={visiblePresentations.length}
        />
      )}
    </Box>
  );
};

export default PresentationsTab;
