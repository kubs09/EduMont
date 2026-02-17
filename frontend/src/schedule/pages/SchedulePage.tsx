import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  HStack,
  VStack,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Card,
  CardBody,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  IconButton,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import {
  AddIcon,
  RepeatIcon,
  DeleteIcon,
  EditIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@chakra-ui/icons';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import {
  getAllCategoryPresentations,
  createCategoryPresentation,
  updateCategoryPresentation,
  deleteCategoryPresentation,
  CategoryPresentation,
  CreateCategoryPresentationData,
} from '@frontend/services/api/categoryPresentation';

const SchedulePage: React.FC = () => {
  const { language } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [presentations, setPresentations] = useState<CategoryPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPresentation, setEditingPresentation] = useState<CategoryPresentation | null>(null);
  const [formData, setFormData] = useState<Partial<CreateCategoryPresentationData>>({
    category: '',
    name: '',
    display_order: 0,
    notes: '',
  });

  const userRole = localStorage.getItem('userRole') || '';
  const isAdmin = userRole === 'admin';

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/';
    }
  }, [isAdmin]);

  const loadPresentations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCategoryPresentations();
      setPresentations(data);
    } catch (error) {
      toast({
        title: 'Error loading presentations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPresentations();
  }, [loadPresentations]);

  const handleOpenModal = (presentation?: CategoryPresentation) => {
    if (presentation) {
      setEditingPresentation(presentation);
      setFormData({
        category: presentation.category,
        name: presentation.name,
        display_order: presentation.display_order,
        notes: presentation.notes,
      });
    } else {
      setEditingPresentation(null);
      setFormData({
        category: '',
        name: '',
        display_order: 0,
        notes: '',
      });
    }
    onOpen();
  };

  const handleSavePresentation = async () => {
    try {
      if (!formData.category || !formData.name || formData.display_order === undefined) {
        toast({
          title: 'Please fill in all required fields',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (editingPresentation) {
        await updateCategoryPresentation({
          id: editingPresentation.id,
          category: formData.category,
          name: formData.name,
          display_order: formData.display_order,
          notes: formData.notes,
        });
        toast({
          title: 'Presentation updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createCategoryPresentation({
          category: formData.category,
          name: formData.name,
          display_order: formData.display_order,
          notes: formData.notes,
        });
        toast({
          title: 'Presentation created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
      await loadPresentations();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save';
      let description = errorMessage;

      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as Record<string, unknown>).response === 'object'
      ) {
        const response = (error as Record<string, unknown>).response as Record<string, unknown>;
        if ('data' in response && typeof response.data === 'object' && response.data !== null) {
          const data = response.data as Record<string, unknown>;
          if ('error' in data && typeof data.error === 'string') {
            description = data.error;
          }
        }
      }

      toast({
        title: 'Error saving presentation',
        description,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeletePresentation = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this presentation?')) {
      try {
        await deleteCategoryPresentation(id);
        toast({
          title: 'Presentation deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadPresentations();
      } catch (error) {
        toast({
          title: 'Error deleting presentation',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleReorder = async (presentation: CategoryPresentation, direction: 'up' | 'down') => {
    try {
      const newOrder =
        direction === 'up' ? presentation.display_order - 1 : presentation.display_order + 1;

      // Check if order is valid
      const categoryPresentations = presentations.filter(
        (p) => p.category === presentation.category
      );
      if (newOrder < 1 || newOrder > categoryPresentations.length) {
        toast({
          title: 'Cannot reorder beyond limits',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Find the presentation that will be swapped
      const swapPresentation = categoryPresentations.find((p) => p.display_order === newOrder);

      if (!swapPresentation) return;

      // Update presentations sequentially to avoid deadlock
      // Update in ID order to ensure consistent transaction order
      const updates = [
        { id: presentation.id, display_order: newOrder },
        { id: swapPresentation.id, display_order: presentation.display_order },
      ].sort((a, b) => a.id - b.id);

      for (const update of updates) {
        await updateCategoryPresentation(update);
      }

      await loadPresentations();
      toast({
        title: 'Order updated successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating order',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Group presentations by category
  const categories = Array.from(new Set(presentations.map((p) => p.category))).sort();
  const getPresentationsByCategory = (category: string) =>
    presentations
      .filter((p) => p.category === category)
      .sort((a, b) => a.display_order - b.display_order);

  if (loading) {
    return (
      <Center p={8}>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <HStack justify="space-between" wrap="wrap" spacing={4} mb={6}>
              <Heading size={{ base: 'md', md: 'lg' }}>
                {language === 'cs' ? 'Správa kurikula' : 'Curriculum Management'}
              </Heading>
              <HStack spacing={2}>
                <Button
                  leftIcon={<RepeatIcon />}
                  variant="outline"
                  onClick={loadPresentations}
                  size={{ base: 'sm', md: 'md' }}
                >
                  {texts.schedule.refresh[language]}
                </Button>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={() => handleOpenModal()}
                  size={{ base: 'sm', md: 'md' }}
                >
                  {language === 'cs' ? 'Přidat prezentaci' : 'Add Presentation'}
                </Button>
              </HStack>
            </HStack>

            {categories.length === 0 ? (
              <Text variant="empty">{language === 'cs' ? 'Žádné kategorie' : 'No categories'}</Text>
            ) : (
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
                                <Th>{language === 'cs' ? 'Pořadí' : 'Order'}</Th>
                                <Th>{language === 'cs' ? 'Název' : 'Name'}</Th>
                                <Th>{language === 'cs' ? 'Poznámky' : 'Notes'}</Th>
                                <Th>{language === 'cs' ? 'Akce' : 'Actions'}</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {categoryPresentations.map((presentation, index) => (
                                <Tr key={presentation.id}>
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
                                        onClick={() => handleReorder(presentation, 'up')}
                                      />
                                      <IconButton
                                        aria-label="Move down"
                                        icon={<ArrowDownIcon />}
                                        size="sm"
                                        isDisabled={index === categoryPresentations.length - 1}
                                        onClick={() => handleReorder(presentation, 'down')}
                                      />
                                      <IconButton
                                        aria-label="Edit"
                                        icon={<EditIcon />}
                                        size="sm"
                                        onClick={() => handleOpenModal(presentation)}
                                      />
                                      <IconButton
                                        aria-label="Delete"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => handleDeletePresentation(presentation.id)}
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
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Modal for adding/editing presentation */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingPresentation
              ? language === 'cs'
                ? 'Upravit prezentaci'
                : 'Edit Presentation'
              : language === 'cs'
                ? 'Přidat prezentaci'
                : 'Add Presentation'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>{language === 'cs' ? 'Kategorie' : 'Category'}</FormLabel>
                <Input
                  placeholder={language === 'cs' ? 'np. Umění a řemesla' : 'e.g. Arts and Crafts'}
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  isReadOnly={!!editingPresentation}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>{language === 'cs' ? 'Název' : 'Name'}</FormLabel>
                <Input
                  placeholder={language === 'cs' ? 'np. Kreslení obrázků' : 'e.g. Draw Pictures'}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>{language === 'cs' ? 'Pořadí' : 'Display Order'}</FormLabel>
                <NumberInput
                  min={1}
                  value={formData.display_order || 0}
                  onChange={(val) =>
                    setFormData({ ...formData, display_order: parseInt(val) || 0 })
                  }
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>{language === 'cs' ? 'Poznámky' : 'Notes'}</FormLabel>
                <Textarea
                  placeholder={language === 'cs' ? 'Volitelné poznámky' : 'Optional notes'}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {language === 'cs' ? 'Zrušit' : 'Cancel'}
            </Button>
            <Button colorScheme="blue" onClick={handleSavePresentation}>
              {language === 'cs' ? 'Uložit' : 'Save'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SchedulePage;
