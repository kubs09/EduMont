import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  VStack,
} from '@chakra-ui/react';
import {
  CategoryPresentation,
  CreateCategoryPresentationData,
} from '@frontend/services/api/categoryPresentation';
import texts from '@frontend/texts';

interface AddEditPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPresentation: CategoryPresentation | null;
  formData: Partial<CreateCategoryPresentationData>;
  onFormDataChange: (data: Partial<CreateCategoryPresentationData>) => void;
  onSave: () => void;
  language: 'cs' | 'en';
}

const AddEditPresentationModal: React.FC<AddEditPresentationModalProps> = ({
  isOpen,
  onClose,
  editingPresentation,
  formData,
  onFormDataChange,
  onSave,
  language,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editingPresentation
            ? texts.schedule.curriculum.editPresentation[language]
            : texts.schedule.curriculum.addPresentation[language]}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{texts.schedule.category[language]}</FormLabel>
              <Input
                placeholder={texts.schedule.placeholders.category[language]}
                value={formData.category || ''}
                onChange={(e) => onFormDataChange({ ...formData, category: e.target.value })}
                isReadOnly={!!editingPresentation}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{texts.schedule.ageGroup[language]}</FormLabel>
              <Select
                value={formData.age_group || ''}
                onChange={(e) => onFormDataChange({ ...formData, age_group: e.target.value })}
              >
                <option value="Infant">Infant (0-1)</option>
                <option value="Toddler">Toddler (1-3)</option>
                <option value="Early Childhood">Early Childhood (3-6)</option>
                <option value="Lower Elementary">Lower Elementary (6-9)</option>
                <option value="Upper Elementary">Upper Elementary (9-12)</option>
                <option value="Middle School">Middle School (12-15)</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{texts.schedule.name[language]}</FormLabel>
              <Input
                placeholder={texts.schedule.placeholders.name[language]}
                value={formData.name || ''}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{texts.schedule.order[language]}</FormLabel>
              <NumberInput
                min={1}
                value={formData.display_order || 0}
                onChange={(val) =>
                  onFormDataChange({ ...formData, display_order: parseInt(val) || 0 })
                }
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>{texts.schedule.notes[language]}</FormLabel>
              <Textarea
                placeholder={texts.schedule.placeholders.notes[language]}
                value={formData.notes || ''}
                onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button variant="primary" onClick={onSave}>
            {texts.common.save[language]}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddEditPresentationModal;
