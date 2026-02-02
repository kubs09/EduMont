import React from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Document, createDocument } from '@frontend/services/api';
import { Child } from '@frontend/types/child';

interface DocumentsTabProps {
  documents: Document[];
  language: 'cs' | 'en';
  canUpload: boolean;
  childData: Child;
  onDocumentsUpdate: () => Promise<void>;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  language,
  canUpload,
  childData,
  onDocumentsUpdate,
}) => {
  const toast = useToast();
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = React.useState('');
  const [uploadDescription, setUploadDescription] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handleUploadDocument = async () => {
    if (!childData.id || !uploadFile) return;

    const maxBytes = 500 * 1024;
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

      const dataUrl = await readFileAsDataUrl(uploadFile);
      const title = uploadTitle.trim() || uploadFile.name;

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

      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      await onDocumentsUpdate();

      toast({
        title: texts.profile.success[language],
        description: texts.document.error.uploadSuccess[language],
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast({
        title: texts.profile.error[language],
        description: texts.document.error.uploadFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      {canUpload && (
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Text fontWeight="bold" mb={3}>
            {texts.document.uploadDocument[language]}
          </Text>
          <VStack align="stretch" spacing={3}>
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
            <Button
              colorScheme="blue"
              onClick={handleUploadDocument}
              isLoading={isUploading}
              isDisabled={!uploadFile}
            >
              {texts.document.uploadDocument[language]}
            </Button>
          </VStack>
        </Box>
      )}

      {documents.length > 0 ? (
        <TableContainer>
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th>{texts.document.title[language]}</Th>
                <Th>{texts.document.file[language]}</Th>
                <Th>{texts.document.type[language]}</Th>
                <Th>{texts.document.createdAt?.[language]}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {documents.map((doc) => (
                <Tr key={doc.id}>
                  <Td>
                    <Text fontWeight="medium">{doc.title}</Text>
                    {doc.description && (
                      <Text fontSize="sm" color="gray.600">
                        {doc.description}
                      </Text>
                    )}
                  </Td>
                  <Td>
                    <Text
                      as="a"
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="blue.500"
                      textDecoration="underline"
                    >
                      {doc.file_name || doc.file_url}
                    </Text>
                  </Td>
                  <Td>
                    <Text>{doc.mime_type || '-'}</Text>
                  </Td>
                  <Td>
                    <Text>
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString(language) : '-'}
                    </Text>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Text color="gray.600">{texts.document.noDocuments[language]}</Text>
      )}
    </VStack>
  );
};

export default DocumentsTab;
