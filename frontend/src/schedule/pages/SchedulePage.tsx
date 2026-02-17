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
  deleteCategoryPresentation,
  CategoryPresentation,
  CreateCategoryPresentationData,
} from '@frontend/services/api/categoryPresentation';
import AddEditPresentationModal from '../components/AddEditPresentationModal';
import SchedulePresentationsAccordion from '../components/SchedulePresentationsAccordion';

const SchedulePage: React.FC = () => {
  const { language } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [presentations, setPresentations] = useState<CategoryPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPresentation, setEditingPresentation] = useState<CategoryPresentation | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
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
    if (presentation) {
      setEditingPresentation(presentation);
      setFormData({
        category: presentation.category,
        name: presentation.name,
        age_group: presentation.age_group,
        display_order: presentation.display_order,
        notes: presentation.notes,
      });
    } else {
      setEditingPresentation(null);
      setFormData({
        category: '',
        name: '',
        age_group: '',
        display_order: 0,
        notes: '',
      });
    }
    onOpen();
  };

  const handleSavePresentation = async () => {
    try {
      if (
        !formData.category ||
        !formData.name ||
        !formData.age_group ||
        formData.display_order === undefined
      ) {
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
          age_group: formData.age_group,
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
          age_group: formData.age_group,
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
              onDelete={handleDeletePresentation}
              language={language}
            />
          </CardBody>
        </Card>
      </VStack>

      <AddEditPresentationModal
        isOpen={isOpen}
        onClose={onClose}
        editingPresentation={editingPresentation}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSavePresentation}
        language={language}
      />
    </Box>
  );
};

export default SchedulePage;
