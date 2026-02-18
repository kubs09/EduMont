import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  useToast,
  Button,
  VStack,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Presentation } from '@frontend/types/presentation';
import { updateChildPresentationStatus } from '@frontend/services/api/presentation';

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
  const toast = useToast();
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
        title: texts.presentation.messages.updateSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: texts.presentation.messages.updateError[language],
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
      <HStack mb={3} spacing={2} align="center">
        <Text variant="filter">{texts.presentation.category[language]}:</Text>
        <Select
          size="sm"
          maxW="220px"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </HStack>
      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>{texts.presentation.name[language]}</Th>
              <Th>{texts.presentation.order[language]}</Th>
              <Th>{texts.presentation.category[language]}</Th>
              <Th>{texts.presentation.status.label[language]}</Th>
              <Th>{texts.presentation.notes[language]}</Th>
              <Th>{texts.common.actions[language]}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {visiblepresentations.map((presentation) => (
              <Tr key={presentation.id}>
                <Td>
                  <Text fontWeight="medium">{presentation.name}</Text>
                </Td>
                <Td>
                  <Badge colorScheme="blue" variant="outlined">
                    {presentation.display_order}
                  </Badge>
                </Td>
                <Td>
                  <Text>{presentation.category || '-'}</Text>
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(presentation.status)} variant="subtle">
                    {getStatusText(presentation.status)}
                  </Badge>
                </Td>
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
                <Td>
                  {canUpdateStatus ? (
                    <VStack spacing={1} align="stretch">
                      <Button
                        size="sm"
                        colorScheme="green"
                        isDisabled={
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
                        size="sm"
                        colorScheme="red"
                        isDisabled={
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
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PresentationsSection;
