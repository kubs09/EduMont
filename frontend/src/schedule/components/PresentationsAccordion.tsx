import React from 'react';
import { Accordion, Box, Heading, HStack, IconButton, Table, Text } from '@chakra-ui/react';
import { FiArrowUp, FiArrowDown, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { texts } from '@frontend/texts';
import { CategoryPresentation } from '@frontend/types/presentation-category';

interface PresentationsAccordionProps {
  categories: string[];
  getPresentationsByCategory: (category: string) => CategoryPresentation[];
  onReorder: (presentation: CategoryPresentation, direction: 'up' | 'down') => void;
  onEdit: (presentation: CategoryPresentation) => void;
  onDelete: (id: number) => void;
  language: 'cs' | 'en';
}

const PresentationsAccordion: React.FC<PresentationsAccordionProps> = ({
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
    <Accordion.Root multiple defaultValue={[categories[0]]}>
      {categories.map((category) => {
        const categoryPresentations = getPresentationsByCategory(category);
        return (
          <Accordion.Item key={category} value={category}>
            <Accordion.ItemTrigger>
              <Box flex="1" textAlign="left">
                <Heading size="sm">
                  {category} ({categoryPresentations.length})
                </Heading>
              </Box>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent pb={4}>
              <Accordion.ItemBody>
                <Table.ScrollArea>
                  <Table.Root variant="line" size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>{texts.schedule.ageGroup[language]}</Table.ColumnHeader>
                        <Table.ColumnHeader>{texts.schedule.order[language]}</Table.ColumnHeader>
                        <Table.ColumnHeader>{texts.schedule.name[language]}</Table.ColumnHeader>
                        <Table.ColumnHeader>{texts.schedule.notes[language]}</Table.ColumnHeader>
                        <Table.ColumnHeader>{texts.common.actions[language]}</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {categoryPresentations.map((presentation, index) => (
                        <Table.Row key={presentation.id}>
                          <Table.Cell>{presentation.age_group}</Table.Cell>
                          <Table.Cell>{presentation.display_order}</Table.Cell>
                          <Table.Cell>{presentation.name}</Table.Cell>
                          <Table.Cell>{presentation.notes || '-'}</Table.Cell>
                          <Table.Cell>
                            <HStack gap={2}>
                              <IconButton
                                aria-label={texts.schedule.curriculum.moveUp[language]}
                                size="sm"
                                disabled={index === 0}
                                onClick={() => onReorder(presentation, 'up')}
                              >
                                <FiArrowUp />
                              </IconButton>
                              <IconButton
                                aria-label={texts.schedule.curriculum.moveDown[language]}
                                size="sm"
                                disabled={index === categoryPresentations.length - 1}
                                onClick={() => onReorder(presentation, 'down')}
                              >
                                <FiArrowDown />
                              </IconButton>
                              <IconButton
                                aria-label={texts.common.edit[language]}
                                size="sm"
                                onClick={() => onEdit(presentation)}
                              >
                                <FiEdit2 />
                              </IconButton>
                              <IconButton
                                aria-label={texts.common.delete[language]}
                                size="sm"
                                colorPalette="red"
                                onClick={() => onDelete(presentation.id)}
                              >
                                <FiTrash2 />
                              </IconButton>
                            </HStack>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Table.ScrollArea>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
};

export default PresentationsAccordion;
