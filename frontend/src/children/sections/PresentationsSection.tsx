import React, { useMemo, useState, useEffect } from 'react';
import { Box, HStack, Text, Badge, Table, NativeSelect, Button, VStack } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Presentation } from '@frontend/types/presentation';
import { updateChildPresentationStatus } from '@frontend/services/api/presentation';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

interface PresentationsSectionProps {
  presentations: Presentation[];
  language: 'cs' | 'en';
  childId: number;
  display_order: number;
  canUpdateStatus?: boolean;
  onStatusUpdated?: (presentationId: number, newStatus: Presentation['status']) => void;
}

const PresentationsSection: React.FC<PresentationsSectionProps> = ({
  presentations,
  language,
  childId,
  canUpdateStatus = false,
  onStatusUpdated,
}) => {
  const toast = useAppToast();
  const [updatingpresentationId, setUpdatingpresentationId] = useState<number | null>(null);
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
        return status || '-';
    }
  };

  const statusOptions: Presentation['status'][] = [
    'prerequisites not met',
    'to be presented',
    'presented',
    'practiced',
    'mastered',
  ];

  const categories = useMemo(() => {
    const unique = new Set(
      presentations.map((presentation) => presentation.category).filter((category) => category)
    );
    return Array.from(unique).sort();
  }, [presentations]);

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (!selectedCategory && categories.length > 0 && categories[0]) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const visiblepresentations = useMemo(() => {
    const filtered = selectedCategory
      ? presentations.filter((presentation) => presentation.category === selectedCategory)
      : presentations;

    return [...filtered].sort((a, b) => {
      const aOrder =
        typeof a.display_order === 'number' ? a.display_order : Number.MAX_SAFE_INTEGER;
      const bOrder =
        typeof b.display_order === 'number' ? b.display_order : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }, [presentations, selectedCategory]);

  const getStatusRank = (status: Presentation['status']): number => {
    const ranks: Record<Presentation['status'], number> = {
      'prerequisites not met': 0,
      'to be presented': 1,
      presented: 2,
      practiced: 3,
      mastered: 4,
    };
    return ranks[status] || 0;
  };

  const getNextStatus = (currentStatus: Presentation['status']): Presentation['status'] | null => {
    const currentRank = getStatusRank(currentStatus);
    if (currentRank >= statusOptions.length - 1) return null;
    return statusOptions[currentRank + 1];
  };

  const getPreviousStatus = (
    currentStatus: Presentation['status']
  ): Presentation['status'] | null => {
    const currentRank = getStatusRank(currentStatus);
    if (currentRank <= 0) return null;
    return statusOptions[currentRank - 1];
  };

  const isPresentationDisabled = (presentationId: number): boolean => {
    const index = visiblepresentations.findIndex((s) => s.id === presentationId);
    if (index === 0) return false;

    const previousPresentation = visiblepresentations[index - 1];
    return getStatusRank(previousPresentation.status) < 2;
  };

  const handleChangeStatus = async (presentationId: number, newStatus: Presentation['status']) => {
    if (!canUpdateStatus) {
      return;
    }

    const presentation = presentations.find((item) => item.id === presentationId);
    if (!presentation || presentation.status === newStatus) {
      return;
    }

    setUpdatingpresentationId(presentationId);
    try {
      await updateChildPresentationStatus(childId, presentationId, newStatus);
      onStatusUpdated?.(presentationId, newStatus);

      if (newStatus === 'to be presented') {
        const index = visiblepresentations.findIndex((s) => s.id === presentationId);
        if (index !== -1) {
          for (let i = index + 1; i < visiblepresentations.length; i++) {
            const nextpresentation = visiblepresentations[i];
            if (nextpresentation.status === 'to be presented') {
              try {
                await updateChildPresentationStatus(
                  childId,
                  nextpresentation.id,
                  'prerequisites not met'
                );
                onStatusUpdated?.(nextpresentation.id, 'prerequisites not met');
              } catch (error) {
                console.error('Failed to update subsequent presentation status:', error);
              }
            }
          }
        }
      }

      if (getStatusRank(newStatus) >= 2) {
        const index = visiblepresentations.findIndex((s) => s.id === presentationId);
        if (index !== -1 && index < visiblepresentations.length - 1) {
          const nextpresentation = visiblepresentations[index + 1];
          if (getStatusRank(nextpresentation.status) < 1) {
            try {
              await updateChildPresentationStatus(childId, nextpresentation.id, 'to be presented');
              onStatusUpdated?.(nextpresentation.id, 'to be presented');
            } catch (error) {
              console.error('Failed to update next presentation status:', error);
            }
          }
        }
      }

      toast({
        title: texts.schedule.success.updated[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: texts.schedule.errors.updateFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdatingpresentationId(null);
    }
  };

  return (
    <Box>
      <HStack mb={3} gap={2} align="center">
        <Text variant="filter">{texts.schedule.category[language]}:</Text>
        <NativeSelect.Root size="sm" maxW="220px">
          <NativeSelect.Field
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>
      <Table.ScrollArea>
        <Table.Root variant="simple" size="md">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{texts.schedule.name[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.schedule.order[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.schedule.category[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.schedule.status.label[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.schedule.notes[language]}</Table.ColumnHeader>
              <Table.ColumnHeader>{texts.common.actions[language]}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {visiblepresentations.map((presentation) => (
              <Table.Row key={presentation.id}>
                <Table.Cell>
                  <Text fontWeight="medium">{presentation.name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge colorPalette="blue" variant="outline">
                    {presentation.display_order}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text>{presentation.category || '-'}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={getStatusColor(presentation.status)} variant="subtle">
                    {getStatusText(presentation.status)}
                  </Badge>
                </Table.Cell>
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
                <Table.Cell>
                  {canUpdateStatus ? (
                    <VStack gap={1} align="stretch">
                      <Button
                        aria-label={texts.schedule.status.changeStatus[language]}
                        size="sm"
                        colorPalette="green"
                        disabled={
                          updatingpresentationId === presentation.id ||
                          isPresentationDisabled(presentation.id) ||
                          getNextStatus(presentation.status) === null
                        }
                        onClick={() => {
                          const nextStatus = getNextStatus(presentation.status);
                          if (nextStatus) {
                            handleChangeStatus(presentation.id, nextStatus);
                          }
                        }}
                      >
                        ↑
                      </Button>
                      <Button
                        aria-label={texts.schedule.status.changeStatus[language]}
                        size="sm"
                        colorPalette="red"
                        disabled={
                          updatingpresentationId === presentation.id ||
                          isPresentationDisabled(presentation.id) ||
                          getPreviousStatus(presentation.status) === null
                        }
                        onClick={() => {
                          const prevStatus = getPreviousStatus(presentation.status);
                          if (prevStatus) {
                            handleChangeStatus(presentation.id, prevStatus);
                          }
                        }}
                      >
                        ↓
                      </Button>
                    </VStack>
                  ) : (
                    <Text color="gray.500">-</Text>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
};

export default PresentationsSection;
