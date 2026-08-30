import React from 'react';
import { Box, Button, Text, VStack, Table, HStack, IconButton, Link } from '@chakra-ui/react';
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
    <VStack align="stretch" gap={4}>
      {documents.length > 0 ? (
        <Table.ScrollArea>
          <Table.Root variant="line" size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{texts.children.documents.title[language]}</Table.ColumnHeader>
                <Table.ColumnHeader>{texts.children.documents.file[language]}</Table.ColumnHeader>
                <Table.ColumnHeader>{texts.children.documents.type[language]}</Table.ColumnHeader>
                <Table.ColumnHeader>
                  {texts.children.documents.createdAt[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader>{texts.common.actions[language]}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {documents.map((doc) => (
                <Table.Row key={doc.id}>
                  <Table.Cell>
                    <Text fontWeight="medium">{doc.title}</Text>
                    {doc.description && (
                      <Text fontSize="sm" color="text-secondary">
                        {doc.description}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Link
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="fg-brand"
                      textDecoration="underline"
                    >
                      {doc.file_name || doc.file_url}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>{doc.mime_type || '-'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString(language) : '-'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {canDelete && (
                      <HStack gap={2}>
                        <IconButton
                          aria-label="delete"
                          size="sm"
                          variant="delete"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <FiTrash2 />
                        </IconButton>
                      </HStack>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      ) : (
        <Text variant="empty">{texts.children.documents.noDocuments[language]}</Text>
      )}

      {canUpload && (
        <Box>
          <Button variant="brand" onClick={() => setIsModalOpen(true)}>
            <FiPlus />
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
