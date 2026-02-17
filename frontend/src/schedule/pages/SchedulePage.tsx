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
  Text,
  Select,
} from '@chakra-ui/react';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import {
  getAllCategoryPresentations,
  createCategoryPresentation,
  updateCategoryPresentation,
  CategoryPresentation,
  CreateCategoryPresentationData,
} from '@frontend/services/api/categoryPresentation';
import AddEditPresentationModal from '../components/AddEditPresentationModal';
import SchedulePresentationsAccordion from '../components/SchedulePresentationsAccordion';
import DeletePresentationDialog from '../components/DeletePresentationDialog';

const SchedulePage: React.FC = () => {
  const { language } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [presentations, setPresentations] = useState<CategoryPresentation[]>([]);
  const [selectedPresentation, setPresentation] = useState<CategoryPresentation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPresentation, setEditingPresentation] = useState<CategoryPresentation | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [maxOrder, setMaxOrder] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<CreateCategoryPresentationData>>({
    category: '',
    name: '',
    display_order: 0,
    notes: '',
  });

  const userRole = localStorage.getItem('userRole') || '';
  const isAdmin = userRole === 'admin';

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

  useEffect(() => {
    if (presentations.length > 0 && !selectedAgeGroup) {
      const ageGroups = Array.from(
        new Set(presentations.map((p) => p.age_group).filter((ageGroup) => ageGroup))
      ).sort();
      if (ageGroups.length > 0) {
        setSelectedAgeGroup(ageGroups[0]);
      }
    }
  }, [presentations, selectedAgeGroup]);

  const handleOpenModal = (presentation?: CategoryPresentation) => {
    let category = '';
    let ageGroup = '';
    let maxOrderValue = 1;

    if (presentation) {
      setEditingPresentation(presentation);
      category = presentation.category;
      ageGroup = presentation.age_group;
      setFormData({
        category: presentation.category,
        name: presentation.name,
        age_group: presentation.age_group,
        display_order: presentation.display_order,
        notes: presentation.notes,
      });
    } else {
      setEditingPresentation(null);
      category = '';
      ageGroup = selectedAgeGroup;
      setFormData({
        category: '',
        name: '',
        age_group: selectedAgeGroup,
        display_order: 0,
        notes: '',
      });
    }

    if (category && ageGroup) {
      const relevantPresentations = presentations.filter(
        (p) => p.category === category && p.age_group === ageGroup
      );
      maxOrderValue = presentation
        ? relevantPresentations.length
        : relevantPresentations.length + 1;
    } else if (ageGroup) {
      const ageGroupPresentations = presentations.filter((p) => p.age_group === ageGroup);
      maxOrderValue = ageGroupPresentations.length + 1;
    } else {
      maxOrderValue = 1;
    }

    setMaxOrder(maxOrderValue);
    onOpen();
  };

  const handleSavePresentation = async () => {
    try {
      const category = formData.category || '';
      const name = formData.name || '';
      const age_group = formData.age_group || '';
      const display_order = formData.display_order || 0;

      if (editingPresentation) {
        await updateCategoryPresentation({
          id: editingPresentation.id,
          category,
          name,
          age_group,
          display_order,
          notes: formData.notes,
        });
        toast({
          title: texts.schedule.messages.updateSuccess[language],
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createCategoryPresentation({
          category,
          name,
          age_group,
          display_order,
          notes: formData.notes,
        });
        toast({
          title: texts.schedule.messages.createSuccess[language],
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
      await loadPresentations();
    } catch (error: unknown) {
      let errorMessage = texts.schedule.messages.createError[language];

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as Record<string, unknown>).response === 'object'
      ) {
        const response = (error as Record<string, unknown>).response as Record<string, unknown>;
        if ('data' in response && typeof response.data === 'object' && response.data !== null) {
          const data = response.data as Record<string, unknown>;
          if ('error' in data && typeof data.error === 'string') {
            errorMessage = data.error;
          }
        }
      }
      toast({
        title: texts.schedule.messages.createError[language],
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleReorder = async (presentation: CategoryPresentation, direction: 'up' | 'down') => {
    try {
      const newOrder =
        direction === 'up' ? presentation.display_order - 1 : presentation.display_order + 1;

      const categoryPresentations = presentations.filter(
        (p) => p.category === presentation.category && p.age_group === presentation.age_group
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

      const swapPresentation = categoryPresentations.find((p) => p.display_order === newOrder);

      if (!swapPresentation) return;

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

  const ageGroups = Array.from(
    new Set(presentations.map((p) => p.age_group).filter((ageGroup) => ageGroup))
  ).sort();

  const filteredPresentations = presentations.filter((p) => p.age_group === selectedAgeGroup);

  const categories = Array.from(new Set(filteredPresentations.map((p) => p.category))).sort();
  const getPresentationsByCategory = (category: string) =>
    filteredPresentations
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
            <VStack spacing={4} mb={6} align="stretch">
              <HStack justify="space-between" spacing={2}>
                <Heading size={{ base: 'md', md: 'lg' }}>
                  {texts.schedule.curriculum.curriculumManagement[language]}
                </Heading>
                <HStack spacing={2}>
                  <Button
                    leftIcon={<RepeatIcon />}
                    variant="outline"
                    onClick={loadPresentations}
                    size={{ base: 'sm', md: 'md' }}
                    px={{ base: '8px', md: 'auto' }}
                  >
                    <Box display={{ base: 'none', md: 'inline' }}>
                      {texts.schedule.refresh[language]}
                    </Box>
                  </Button>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={() => handleOpenModal()}
                    size={{ base: 'sm', md: 'md' }}
                    px={{ base: '8px', md: 'auto' }}
                  >
                    <Box display={{ base: 'none', md: 'inline' }}>
                      {texts.schedule.addEntry[language]}
                    </Box>
                  </Button>
                </HStack>
              </HStack>
              <HStack spacing={2}>
                <Text variant="filter">{texts.schedule.ageGroup[language]}:</Text>
                <Select
                  size="sm"
                  value={selectedAgeGroup}
                  borderRadius="md"
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  w="fit-content"
                >
                  {ageGroups.map((ageGroup) => (
                    <option key={ageGroup} value={ageGroup}>
                      {ageGroup}
                    </option>
                  ))}
                </Select>
              </HStack>
            </VStack>

            <SchedulePresentationsAccordion
              categories={categories}
              getPresentationsByCategory={getPresentationsByCategory}
              onReorder={handleReorder}
              onEdit={handleOpenModal}
              onDelete={(presentationId) => {
                setPresentation(presentations.find((p) => p.id === presentationId) || null);
                setDeleteDialogOpen(true);
              }}
              language={language}
            />
          </CardBody>
        </Card>
      </VStack>

      <AddEditPresentationModal
        isOpen={isOpen}
        onClose={onClose}
        categories={categories}
        editingPresentation={editingPresentation}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSavePresentation}
        language={language}
        maxOrder={maxOrder}
      />
      <DeletePresentationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        presentationId={selectedPresentation?.id || 0}
        language={language}
        onPresentationDeleted={loadPresentations}
      />
    </Box>
  );
};

export default SchedulePage;
