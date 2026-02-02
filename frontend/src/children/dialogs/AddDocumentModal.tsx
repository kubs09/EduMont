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
} from '@chakra-ui/react';
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{texts.document.uploadDocument[language]}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel>{texts.document.title[language]}</FormLabel>
              <Input
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder={texts.document.placeholder.title[language]}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{texts.document.description[language]}</FormLabel>
              <Textarea
                value={uploadDescription}
                onChange={(event) => setUploadDescription(event.target.value)}
                placeholder={texts.document.placeholder.description[language]}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{texts.document.file[language]}</FormLabel>
              <Input
                type="file"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
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
