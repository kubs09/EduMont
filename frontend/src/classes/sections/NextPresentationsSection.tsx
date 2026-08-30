import React, { useEffect, useMemo, useState } from 'react';
import { Box, Table, Text, Tabs } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Class, NextPresentation } from '@frontend/types/class';
import TablePagination from '@frontend/shared/components/TablePagination/TablePagination';
import { ChildExcuse } from '@frontend/types/child';
import { PermissionAlertWindow } from '../components/PremissionAlertWindow';
import { requestPermission, checkPermissionRequest } from '@frontend/services/api/permission';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

interface PresentationsTabProps {
  classData: Class;
  nextPresentations: NextPresentation[];
  language: 'cs' | 'en';
  isAdmin: boolean;
  isTeacher: boolean;
  hasPresentationPermission: boolean;
  excusesByChildId: Record<number, ChildExcuse[]>;
}

const PresentationsTab: React.FC<PresentationsTabProps> = ({
  classData,
  nextPresentations,
  language,
  isAdmin,
  isTeacher,
  hasPresentationPermission,
  excusesByChildId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const toast = useAppToast();
  const PAGE_SIZE = 4;

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (isAdmin && !hasPresentationPermission) {
        try {
          const result = await checkPermissionRequest(classData.id);
          setPermissionRequested(result.already_requested);
        } catch (error) {
          console.error('Failed to check permission request status:', error);
        }
      }
    };

    checkExistingRequest();
  }, [isAdmin, hasPresentationPermission, classData.id]);

  const handleRequestPermission = async () => {
    try {
      setIsRequestingPermission(true);
      const response = await requestPermission({
        resource_type: 'class_presentations',
        resource_id: classData.id,
        reason: 'Admin requesting access to view class presentations',
        language,
      });

      if (response.already_requested) {
        setPermissionRequested(true);
      } else {
        setPermissionRequested(true);
        toast({
          title: texts.classes.success.permissionRequestSent[language],
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch {
      toast({
        title: texts.classes.errors.permissionRequestFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

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

  const showPermissionAlert = isAdmin && !hasPresentationPermission;

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

  const visiblePresentations = categoryFilteredPresentations;

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

  if (showPermissionAlert) {
    return (
      <PermissionAlertWindow
        title={texts.classes.detail.presentationsPermissionTitle[language]}
        message={texts.classes.detail.presentationsPermissionMessage[language]}
        onRequestPermission={handleRequestPermission}
        actionLabel={texts.classes.detail.requestPermissionButton[language]}
        submittedLabel={texts.classes.detail.requestSentButton[language]}
        isLoading={isRequestingPermission}
        premissionSubmitted={permissionRequested}
      />
    );
  }

  return (
    <Box>
      {visiblePresentations.length === 0 ? (
        <Text variant="empty">{texts.classes.detail.noNextPresentations[language]}</Text>
      ) : (
        <Box>
          {categoryOptions.length > 1 && (
            <Tabs.Root
              value={activeCategory || categoryOptions[0] || ''}
              onValueChange={(details) => setActiveCategory(details.value)}
              variant="subtle"
              mb={4}
            >
              <Tabs.List flexWrap="wrap" gap={2}>
                {categoryOptions.map((category) => (
                  <Tabs.Trigger
                    key={category}
                    value={category}
                    _selected={{
                      bg: 'bg-brand-solid',
                      color: 'white',
                    }}
                    _hover={{
                      bg: { base: 'gray.200', _dark: 'gray.600' },
                    }}
                    bg={{ base: 'gray.100', _dark: 'gray.700' }}
                    color={{ base: 'gray.700', _dark: 'gray.200' }}
                  >
                    {category}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
          )}
          <Table.ScrollArea>
            <Table.Root variant="line" size="md">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>
                    {texts.common.childrenTable.name[language]}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>{texts.classes.detail.category[language]}</Table.ColumnHeader>
                  <Table.ColumnHeader>
                    {texts.classes.detail.presentation[language]}
                  </Table.ColumnHeader>
                  {(isAdmin || isTeacher) && (
                    <Table.ColumnHeader>{texts.classes.detail.notes[language]}</Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {paginatedPresentations.map((presentation) => (
                  <Table.Row key={`${presentation.child_id}-${presentation.id}`}>
                    <Table.Cell>
                      {presentation.child_firstname} {presentation.child_surname}
                    </Table.Cell>
                    <Table.Cell>{presentation.category}</Table.Cell>
                    <Table.Cell>{presentation.name}</Table.Cell>
                    {(isAdmin || isTeacher) && <Table.Cell>{presentation.notes || '-'}</Table.Cell>}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
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
