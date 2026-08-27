import { Button, Input, Textarea, Box, NativeSelect, Field } from '@chakra-ui/react';
import { CustomModal } from '@frontend/shared/ui/modal';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { editChildSchema } from '@frontend/shared/validation/childSchema';
import { Child, UpdateChildData } from '@frontend/types/child';
import { getUsers } from '@frontend/services/api/user';
import { getClassesByAge } from '@frontend/services/api/class';
import { User } from '@frontend/types/user';
import { Class } from '@frontend/types/class';
import { Combobox } from '@frontend/shared/components/Combobox';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

interface EditChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  childData: Child;
  onSave: (updatedData: UpdateChildData) => Promise<void>;
}

interface FormData {
  firstname: string;
  surname: string;
  notes?: string;
}

const EditChildModal = ({ isOpen, onClose, childData, onSave }: EditChildModalProps) => {
  const { language } = useLanguage();
  const toast = useAppToast();
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  const [formData, setFormData] = useState<FormData>({
    firstname: childData.firstname,
    surname: childData.surname,
    notes: childData.notes || '',
  });
  const [parents, setParents] = useState<User[]>([]);
  const [selectedParentIds, setSelectedParentIds] = useState<number[]>(
    childData.parents?.map((parent) => parent.id) || []
  );
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(childData.class_id || null);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchAvailableClasses = useCallback(async (dateOfBirth: string) => {
    try {
      const age = calculateAge(dateOfBirth);
      if (age === null || age < 0) {
        setAvailableClasses([]);
        return;
      }

      setIsLoadingClasses(true);
      const classes = await getClassesByAge(age);
      setAvailableClasses(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setAvailableClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    setFormData({
      firstname: childData.firstname,
      surname: childData.surname,
      notes: childData.notes || '',
    });
    setSelectedParentIds(childData.parents?.map((parent) => parent.id) || []);
    setSelectedClassId(childData.class_id || null);

    // Fetch available classes for the child's current age
    if (childData.date_of_birth) {
      fetchAvailableClasses(childData.date_of_birth);
    }
  }, [childData, fetchAvailableClasses]);

  useEffect(() => {
    if (!isAdmin || !isOpen) return;

    const fetchParents = async () => {
      try {
        setIsLoadingParents(true);
        const data = await getUsers('parent');
        setParents(data);
      } catch {
        toast({
          title: texts.common.genericError.title[language],
          description: texts.common.genericError.description[language],
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingParents(false);
      }
    };

    fetchParents();
  }, [isAdmin, isOpen, language, toast]);

  const parentOptions = useMemo(() => {
    return parents.map((parent) => ({
      id: parent.id,
      label: `${parent.firstname} ${parent.surname} (${parent.email})`,
    }));
  }, [parents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      const schema = editChildSchema(language, { requireParentIds: isAdmin });
      schema.parse({
        ...formData,
        parent_ids: selectedParentIds,
        class_id: selectedClassId,
      });

      await onSave({
        id: childData.id,
        ...formData,
        parent_ids: isAdmin ? selectedParentIds : undefined,
        class_id: selectedClassId || undefined,
      });
      onClose();
    } catch (error) {
      if (error.issues) {
        const validationErrors: Record<string, string> = {};
        error.issues.forEach((err: { path: string[]; message: string }) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
      } else {
        const isSelectedClassNotSuitable =
          error.message === 'selectedClassNotSuitable' || error.message.includes('not suitable');

        toast({
          title: isSelectedClassNotSuitable
            ? texts.children.errors.noSuitableClassForAge[language]
            : texts.common.genericError.title[language],
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={texts.children.editChild.title[language]}
      buttons={
        <>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button colorPalette="blue" onClick={handleSubmit} loading={isSubmitting}>
            {texts.common.save[language]}
          </Button>
        </>
      }
    >
      {isAdmin && (
        <Field.Root required invalid={!!errors.parent_ids} mb={4}>
          <Field.Label>{texts.common.childrenTable.parent[language]}</Field.Label>
          <Combobox
            options={parentOptions.map((parent) => ({
              label: parent.label,
              value: parent.id,
            }))}
            value={selectedParentIds}
            onChange={(values) =>
              setSelectedParentIds(
                Array.isArray(values) ? values.map((value) => Number(value)) : []
              )
            }
            placeholder={texts.common.childrenTable.parent[language]}
            isMulti
            isDisabled={isLoadingParents}
          />
          <Field.ErrorText>{errors.parent_ids}</Field.ErrorText>
        </Field.Root>
      )}
      <Field.Root required invalid={!!errors.firstname} mb={4}>
        <Field.Label>{texts.common.childrenTable.firstname[language]}</Field.Label>
        <Input name="firstname" value={formData.firstname} onChange={handleChange} />
        <Field.ErrorText>{errors.firstname}</Field.ErrorText>
      </Field.Root>
      <Field.Root required invalid={!!errors.surname} mb={4}>
        <Field.Label>{texts.common.childrenTable.surname[language]}</Field.Label>
        <Input name="surname" value={formData.surname} onChange={handleChange} />
        <Field.ErrorText>{errors.surname}</Field.ErrorText>
      </Field.Root>
      <Field.Root invalid={!!errors.notes} mb={4}>
        <Field.Label>{texts.common.childrenTable.notes[language]}</Field.Label>
        <Textarea name="notes" value={formData.notes} onChange={handleChange} />
        <Field.ErrorText>{errors.notes}</Field.ErrorText>
      </Field.Root>
      <Field.Root invalid={!!errors.class_id} mb={4}>
        <Field.Label>{texts.schedule.class[language]}</Field.Label>
        {isLoadingClasses ? (
          <Box p={2}>{texts.children.classSelection.loading[language]}</Box>
        ) : availableClasses.length > 0 ? (
          <NativeSelect.Root disabled={isLoadingClasses}>
            <NativeSelect.Field
              value={selectedClassId ? selectedClassId.toString() : ''}
              onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
              placeholder={texts.classes.selectClass[language]}
            >
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Ages {cls.min_age}-{cls.max_age})
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        ) : (
          <Box p={2} color="red.500">
            {texts.children.classSelection.noneFound[language]}
          </Box>
        )}
        <Field.ErrorText>{errors.class_id}</Field.ErrorText>
      </Field.Root>
    </CustomModal>
  );
};

export default EditChildModal;
