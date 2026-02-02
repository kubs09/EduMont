import React from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { texts } from '@frontend/texts';
import { Document } from '@frontend/services/api';
import { Child } from '@frontend/types/child';
import AddDocumentModal from '../components/AddDocumentModal';
import DeleteDocumentDialog from '../components/DeleteDocumentDialog';

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null);

  return (
    <VStack align="stretch" spacing={4}>
      {documents.length > 0 ? (
        <TableContainer>
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th>{texts.document.title[language]}</Th>
                <Th>{texts.document.file[language]}</Th>
                <Th>{texts.document.type[language]}</Th>
                <Th>{texts.document.createdAt?.[language]}</Th>
                <Th>{texts.common?.actions?.[language] || 'Actions'}</Th>
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
                  <Td>
                    {canUpload && (
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="delete"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="delete"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setDeleteDialogOpen(true);
                          }}
                        />
                      </HStack>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Text color="gray.600">{texts.document.noDocuments[language]}</Text>
      )}

      {canUpload && (
        <Box>
          <Button leftIcon={<AddIcon />} variant="brand" onClick={() => setIsModalOpen(true)}>
            {texts.document.uploadDocument[language]}
          </Button>
        </Box>
      )}

      <AddDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        childData={childData}
        language={language}
        onDocumentsUpdate={onDocumentsUpdate}
      />

      {selectedDocument && (
        <DeleteDocumentDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedDocument(null);
          }}
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title}
          language={language}
          onDocumentDeleted={onDocumentsUpdate}
        />
      )}
    </VStack>
  );
};

export default DocumentsTab;
