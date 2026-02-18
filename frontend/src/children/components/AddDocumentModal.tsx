import React from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Progress,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';
import { texts } from '@frontend/texts';
import { createDocument } from '@frontend/services/api';
import { Child } from '@frontend/types/child';
import api from '@frontend/services/apiConfig';

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
  const toast = useToast();
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = React.useState('');
  const [uploadDescription, setUploadDescription] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadProgress(0);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const isProduction = process.env.NODE_ENV === 'production';

  const handleUploadDocument = async () => {
    if (!childData.id || !uploadFile) return;

    const maxBytes = 5 * 1024 * 1024;
    if (uploadFile.size > maxBytes) {
      toast({
        title: texts.profile.error[language],
        description: texts.document.error.fileTooLarge[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const title = uploadTitle.trim() || uploadFile.name;

      if (isProduction) {
        const uploadUrlResponse = await api.post('/api/documents/upload-url', {
          fileName: uploadFile.name,
          fileType: uploadFile.type,
          childId: childData.id,
          classId: childData.class_id || undefined,
        });

        const { uploadUrl, filePath } = uploadUrlResponse.data;
        setUploadProgress(25);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': uploadFile.type || 'application/octet-stream',
          },
          body: uploadFile,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        setUploadProgress(75);

        const fileUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/documents/${filePath}`;

        await createDocument({
          title,
          description: uploadDescription.trim() || undefined,
          file_url: fileUrl,
          file_name: uploadFile.name,
          mime_type: uploadFile.type || undefined,
          size_bytes: uploadFile.size,
          child_id: childData.id,
          class_id: childData.class_id || undefined,
        });
      } else {
        const dataUrl = await readFileAsDataUrl(uploadFile);
        setUploadProgress(50);

        await createDocument({
          title,
          description: uploadDescription.trim() || undefined,
          file_url: dataUrl,
          file_name: uploadFile.name,
          mime_type: uploadFile.type || undefined,
          size_bytes: uploadFile.size,
          child_id: childData.id,
          class_id: childData.class_id || undefined,
        });

        setUploadProgress(100);
      }

      resetForm();
      onClose();
      await onDocumentsUpdate();

      toast({
        title: texts.profile.success[language],
        description: texts.document.error.uploadSuccess[language],
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: texts.profile.error[language],
        description: texts.document.error.uploadFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
      setUploadFile(files[0]);
      if (!uploadTitle) {
        setUploadTitle(files[0].name);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
      if (!uploadTitle) {
        setUploadTitle(files[0].name);
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadFile(null);
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
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.document.uploadDocument[language]}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel>{texts.document.documentTitle[language]}</FormLabel>
              <Input
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder={texts.document.placeholder.title[language]}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{texts.document.documentDescription[language]}</FormLabel>
              <Textarea
                value={uploadDescription}
                onChange={(event) => setUploadDescription(event.target.value)}
                placeholder={texts.document.placeholder.description[language]}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{texts.document.file[language]}</FormLabel>
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
                {!uploadFile ? (
                  <VStack spacing={2}>
                    <FiUploadCloud size={48} style={{ color: 'var(--chakra-colors-gray-500)' }} />
                    <Text fontWeight="medium" color="text-primary">
                      {texts.document.placeholder?.dragDrop?.[language]}
                    </Text>
                    <Text fontSize="sm" color="text-secondary">
                      {texts.document.placeholder?.orClick?.[language]}
                    </Text>
                    <Text fontSize="xs" color="text-muted">
                      PDF, DOC, TXT, PNG, JPG (max 5MB)
                    </Text>
                  </VStack>
                ) : (
                  <HStack
                    spacing={3}
                    p={3}
                    bg="bg-surface"
                    borderRadius="md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon as={FiFile} boxSize={6} color="brand.primary.500" />
                    <VStack align="start" flex={1} spacing={0}>
                      <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                        {uploadFile.name}
                      </Text>
                      <Text fontSize="xs" color="text-muted">
                        {formatFileSize(uploadFile.size)}
                      </Text>
                    </VStack>
                    <Button size="sm" variant="ghost" colorScheme="red" onClick={handleRemoveFile}>
                      <Icon as={FiX} />
                    </Button>
                  </HStack>
                )}
              </Box>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            {texts.common?.cancel?.[language] || 'Cancel'}
          </Button>
          <Button
            onClick={handleUploadDocument}
            isLoading={isUploading}
            isDisabled={!uploadFile}
            colorScheme="blue"
          >
            {texts.document.uploadDocument[language]}
          </Button>
        </ModalFooter>
        {isUploading && uploadProgress > 0 && (
          <Box px={6} pb={4}>
            <Progress value={uploadProgress} size="sm" colorScheme="blue" />
            <Text fontSize="sm" color="gray.600" mt={2}>
              {uploadProgress}%
            </Text>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddDocumentModal;
