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
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { texts } from '@frontend/texts';
import { Document } from '@frontend/types/document';
import { Child } from '@frontend/types/child';
import AddDocumentModal from '../components/AddDocumentModal';
import DeleteDocumentDialog from '../components/DeleteDocumentDialog';

interface DocumentsTabProps {
  documents: Document[];
  language: 'cs' | 'en';
  canUpload: boolean;
  canDelete: boolean;
  childData: Child;
  onDocumentsUpdate: () => Promise<void>;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  language,
  canUpload,
  canDelete,
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
                <Th>{texts.children.documents.title[language]}</Th>
                <Th>{texts.children.documents.file[language]}</Th>
                <Th>{texts.children.documents.type[language]}</Th>
                <Th>{texts.children.documents.createdAt[language]}</Th>
                <Th>{texts.common.actions[language]}</Th>
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
                    {canDelete && (
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="delete"
                          icon={<FiTrash2 />}
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
        <Text variant="empty">{texts.children.documents.noDocuments[language]}</Text>
      )}

      {canUpload && (
        <Box>
          <Button leftIcon={<FiPlus />} variant="brand" onClick={() => setIsModalOpen(true)}>
            {texts.children.documents.uploadDocument[language]}
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

      {canDelete && selectedDocument && (
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
