import React from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Input,
  Textarea,
  Progress,
  HStack,
  Icon,
  Field,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomModal } from '@frontend/shared/ui/modal';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';
import { texts } from '@frontend/texts';
import { createDocument } from '@frontend/services/api';
import { Child } from '@frontend/types/child';
import api from '@frontend/services/apiConfig';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';
import { createDocumentSchema, DocumentFormData } from '@frontend/shared/validation/documentSchema';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  childData: Child;
  language: 'cs' | 'en';
  onDocumentsUpdate: () => Promise<void>;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  childData,
  language,
  onDocumentsUpdate,
}) => {
  const toast = useAppToast();
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(createDocumentSchema(language)),
    defaultValues: { title: '', description: '', file: undefined },
  });

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const isProduction = import.meta.env.PROD;

  const handleClose = () => {
    reset({ title: '', description: '', file: undefined });
    setUploadProgress(0);
    onClose();
  };

  const onSubmit = async (data: DocumentFormData) => {
    // The schema's top-level refine already guarantees `file` is defined here.
    const file = data.file as File;

    try {
      setUploadProgress(0);

      const title = data.title?.trim() || file.name;

      if (isProduction) {
        const uploadUrlResponse = await api.post('/api/documents/upload-url', {
          fileName: file.name,
          fileType: file.type,
          childId: childData.id,
          classId: childData.class_id || undefined,
        });

        const { uploadUrl, filePath } = uploadUrlResponse.data;
        setUploadProgress(25);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        setUploadProgress(75);

        const fileUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${filePath}`;

        await createDocument({
          title,
          description: data.description?.trim() || undefined,
          file_url: fileUrl,
          file_name: file.name,
          mime_type: file.type || undefined,
          size_bytes: file.size,
          child_id: childData.id,
          class_id: childData.class_id || undefined,
        });
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        setUploadProgress(50);

        await createDocument({
          title,
          description: data.description?.trim() || undefined,
          file_url: dataUrl,
          file_name: file.name,
          mime_type: file.type || undefined,
          size_bytes: file.size,
          child_id: childData.id,
          class_id: childData.class_id || undefined,
        });

        setUploadProgress(100);
      }

      handleClose();
      await onDocumentsUpdate();

      toast({
        title: texts.children.success.documentUploaded[language],
        status: 'success',
        duration: 3000,
      });
    } catch {
      toast({
        title: texts.children.errors.documentUploadFailed.title[language],
        description: texts.children.errors.documentUploadFailed.description[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadProgress(0);
    }
  };

  const selectFile = (file: File) => {
    setValue('file', file, { shouldValidate: true });
    if (!getValues('title')) {
      setValue('title', file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      selectFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      selectFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setValue('file', undefined, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      size="lg"
      title={texts.children.documents.uploadDocument[language]}
      buttons={
        <>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            {texts.common?.cancel?.[language] || 'Cancel'}
          </Button>
          <Button type="submit" loading={isSubmitting} variant="brand">
            {texts.children.documents.uploadDocument[language]}
          </Button>
        </>
      }
    >
      <VStack align="stretch" gap={4}>
        <Field.Root invalid={!!errors.title}>
          <Field.Label>{texts.children.documents.documentTitle[language]}</Field.Label>
          <Input
            {...register('title')}
            placeholder={texts.children.documents.placeholder.title[language]}
          />
          <Field.ErrorText>{errors.title?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={!!errors.description}>
          <Field.Label>{texts.children.documents.documentDescription[language]}</Field.Label>
          <Textarea
            {...register('description')}
            placeholder={texts.children.documents.placeholder.description[language]}
          />
          <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
        </Field.Root>
        <Controller
          name="file"
          control={control}
          render={({ field: { value } }) => (
            <Field.Root invalid={!!errors.file}>
              <Field.Label>{texts.children.documents.file[language]}</Field.Label>
              <Box
                border="2px dashed"
                borderColor={isDragging ? 'brand.primary.500' : 'border-color'}
                borderRadius="md"
                p={6}
                textAlign="center"
                bg={isDragging ? 'brand.primary.300' : 'bg-surface'}
                transition="all 0.2s"
                cursor="pointer"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                _hover={{ borderColor: 'brand.primary.500', bg: 'brand.primary.300' }}
              >
                <Input
                  ref={fileInputRef}
                  type="file"
                  display="none"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
                {!value ? (
                  <VStack gap={2}>
                    <Box w={12} h={12} color="text-muted">
                      <Icon as={FiUploadCloud as React.ElementType} w={12} h={12} />
                    </Box>
                    <Text fontWeight="medium" color="text-primary">
                      {texts.children.documents.placeholder?.dragDrop?.[language]}
                    </Text>
                    <Text fontSize="sm" color="text-secondary">
                      {texts.children.documents.placeholder?.orClick?.[language]}
                    </Text>
                    <Text fontSize="xs" color="text-muted">
                      PDF, DOC, TXT, PNG, JPG (max 5MB)
                    </Text>
                  </VStack>
                ) : (
                  <HStack
                    gap={3}
                    p={3}
                    bg="bg-surface"
                    borderRadius="md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Box boxSize={6} color="brand.primary.500">
                      <Icon as={FiFile as React.ElementType} w={6} h={6} />
                    </Box>
                    <VStack align="start" flex={1} gap={0}>
                      <Text fontWeight="medium" fontSize="sm" lineClamp={1}>
                        {value.name}
                      </Text>
                      <Text fontSize="xs" color="text-muted">
                        {formatFileSize(value.size)}
                      </Text>
                    </VStack>
                    <Button size="sm" variant="ghost" colorPalette="red" onClick={handleRemoveFile}>
                      <Icon as={FiX as React.ElementType} />
                    </Button>
                  </HStack>
                )}
              </Box>
              <Field.ErrorText>{errors.file?.message}</Field.ErrorText>
              {isSubmitting && uploadProgress > 0 && (
                <Box mt={2} w="100%">
                  <Progress.Root value={uploadProgress} size="sm">
                    <Progress.Track>
                      <Progress.Range bg="bg-brand-solid" />
                    </Progress.Track>
                  </Progress.Root>
                  <Text fontSize="sm" color="text-secondary" mt={2}>
                    {uploadProgress}%
                  </Text>
                </Box>
              )}
            </Field.Root>
          )}
        />
      </VStack>
    </CustomModal>
  );
};

export default AddDocumentModal;
