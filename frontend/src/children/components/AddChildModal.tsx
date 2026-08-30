import { Button, Input, Textarea, Box, NativeSelect, Field } from '@chakra-ui/react';
import { CustomModal } from '@frontend/shared/ui/modal';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { createChild } from '@frontend/services/api';
import { getClassesByAge } from '@frontend/services/api/class';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { createChildSchema } from '@frontend/shared/validation/childSchema';
import DatePicker from '@frontend/shared/components/DatePicker/components/DatePicker';
import { getUsers } from '@frontend/services/api/user';
import { User } from '@frontend/types/user';
import { Class } from '@frontend/types/class';
import { Combobox } from '@frontend/shared/components/Combobox';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';
interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  firstname: string;
  surname: string;
  date_of_birth: string;
  notes?: string;
}

const AddChildModal = ({ isOpen, onClose, onSuccess }: AddChildModalProps) => {
  const { language } = useLanguage();
  const toast = useAppToast();
  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    surname: '',
    date_of_birth: '',
    notes: '',
  });
  const [parents, setParents] = useState<User[]>([]);
  const [selectedParentIds, setSelectedParentIds] = useState<number[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

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
        setSelectedClassId(null);
        return;
      }

      setIsLoadingClasses(true);
      const classes = await getClassesByAge(age);
      setAvailableClasses(classes);

      // Auto-select the first available class
      if (classes.length > 0) {
        setSelectedClassId(classes[0].id);
      } else {
        setSelectedClassId(null);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setAvailableClasses([]);
      setSelectedClassId(null);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !isAdmin) return;

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
  }, [isOpen, isAdmin, language, toast]);

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

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      date_of_birth: date,
    }));
    if (date) {
      fetchAvailableClasses(date);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      const userId = parseInt(localStorage.getItem('userId') || '0');
      if (!isAdmin && !userId) throw new Error('No user ID found');

      const parentIds = isAdmin ? selectedParentIds : [userId];

      const schema = createChildSchema(language, {
        requireParentIds: isAdmin,
        requireClassId: true,
      });
      schema.parse({
        ...formData,
        parent_ids: parentIds,
        class_id: selectedClassId,
      });

      await createChild({
        ...formData,
        parent_ids: parentIds,
        class_id: selectedClassId || undefined,
      });

      onSuccess();
      onClose();
    } catch (error) {
      if (error.issues) {
        const validationErrors: Record<string, string> = {};
        error.issues.forEach((err: { path: string[]; message: string }) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
      } else {
        const isNoSuitableClass =
          error.message === 'noSuitableClass' || error.message.includes('No suitable class');
        const isSelectedClassNotSuitable =
          error.message === 'selectedClassNotSuitable' || error.message.includes('not suitable');

        toast({
          title: isSelectedClassNotSuitable
            ? texts.children.errors.noSuitableClassForAge[language]
            : texts.children.errors.addFailed[language],
          description: isNoSuitableClass
            ? texts.children.errors.noSuitableClassForAge[language]
            : error.message,
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
      title={texts.children.addChild.title[language]}
      buttons={
        <>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {texts.common.cancel[language]}
          </Button>
          <Button variant="brand" onClick={handleSubmit} loading={isSubmitting}>
            {texts.children.addChild.submit[language]}
          </Button>
        </>
      }
    >
      <Field.Root required invalid={!!errors.parent_ids} mb={4}>
        <Field.Label>{texts.common.childrenTable.parent[language]}</Field.Label>
        <Combobox
          options={parentOptions.map((parent) => ({
            label: parent.label,
            value: parent.id,
          }))}
          value={selectedParentIds}
          onChange={(values) =>
            setSelectedParentIds(Array.isArray(values) ? values.map((value) => Number(value)) : [])
          }
          placeholder={texts.common.childrenTable.parent[language]}
          isMulti
          isDisabled={isLoadingParents}
        />
        <Field.ErrorText>{errors.parent_ids}</Field.ErrorText>
      </Field.Root>
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
      <Field.Root required invalid={!!errors.date_of_birth} mb={4}>
        <Field.Label>{texts.children.dateOfBirth[language]}</Field.Label>
        <DatePicker
          viewType="day"
          value={formData.date_of_birth}
          onChange={handleDateChange}
          language={language}
        />
        <Field.ErrorText>{errors.date_of_birth}</Field.ErrorText>
      </Field.Root>
      {formData.date_of_birth && (
        <Field.Root required invalid={!!errors.class_id} mb={4}>
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
            <Box p={2} color="text-danger">
              {texts.children.classSelection.noneFound[language]}
            </Box>
          )}
          <Field.ErrorText>{errors.class_id}</Field.ErrorText>
        </Field.Root>
      )}
      <Field.Root invalid={!!errors.notes} mb={4}>
        <Field.Label>{texts.common.childrenTable.notes[language]}</Field.Label>
        <Textarea name="notes" value={formData.notes} onChange={handleChange} />
        <Field.ErrorText>{errors.notes}</Field.ErrorText>
      </Field.Root>
    </CustomModal>
  );
};

export default AddChildModal;
