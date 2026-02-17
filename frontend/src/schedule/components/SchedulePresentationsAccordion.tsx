import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Heading,
  HStack,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
} from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { texts } from '@frontend/texts';
import { CategoryPresentation } from '@frontend/services/api/categoryPresentation';

interface SchedulePresentationsAccordionProps {
  categories: string[];
  getPresentationsByCategory: (category: string) => CategoryPresentation[];
  onReorder: (presentation: CategoryPresentation, direction: 'up' | 'down') => void;
  onEdit: (presentation: CategoryPresentation) => void;
  onDelete: (id: number) => void;
  language: 'cs' | 'en';
}

const SchedulePresentationsAccordion: React.FC<SchedulePresentationsAccordionProps> = ({
  categories,
  getPresentationsByCategory,
  onReorder,
  onEdit,
  onDelete,
  language,
}) => {
  if (categories.length === 0) {
    return <Text variant="empty">{texts.schedule.noEntries[language]}</Text>;
  }

  return (
    <Accordion allowMultiple defaultIndex={[0]}>
      {categories.map((category) => {
        const categoryPresentations = getPresentationsByCategory(category);
        return (
          <AccordionItem key={category}>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">
                  {category} ({categoryPresentations.length})
                </Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>{texts.schedule.ageGroup[language]}</Th>
                      <Th>{texts.schedule.order[language]}</Th>
                      <Th>{texts.schedule.name[language]}</Th>
                      <Th>{texts.schedule.notes[language]}</Th>
                      <Th>{texts.common.actions[language]}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {categoryPresentations.map((presentation, index) => (
                      <Tr key={presentation.id}>
                        <Td>{presentation.age_group}</Td>
                        <Td>{presentation.display_order}</Td>
                        <Td>{presentation.name}</Td>
                        <Td>{presentation.notes || '-'}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Move up"
                              icon={<ArrowUpIcon />}
                              size="sm"
                              isDisabled={index === 0}
                              onClick={() => onReorder(presentation, 'up')}
                            />
                            <IconButton
                              aria-label="Move down"
                              icon={<ArrowDownIcon />}
                              size="sm"
                              isDisabled={index === categoryPresentations.length - 1}
                              onClick={() => onReorder(presentation, 'down')}
                            />
                            <IconButton
                              aria-label="Edit"
                              icon={<EditIcon />}
                              size="sm"
                              onClick={() => onEdit(presentation)}
                            />
                            <IconButton
                              aria-label="Delete"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => onDelete(presentation.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </AccordionPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default SchedulePresentationsAccordion;
