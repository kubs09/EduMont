import React from 'react';
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  useToast,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import api from '@frontend/services/apiConfig';

interface DeleteDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | number;
  documentTitle: string;
  language: 'cs' | 'en';
  onDocumentDeleted: () => Promise<void>;
}

const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  language,
  onDocumentDeleted,
}) => {
  const cancelRef = React.useRef(null);
  const toast = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/api/documents/${documentId}`);

      toast({
        title: texts.children.success.documentDeleted[language],
        status: 'success',
        duration: 3000,
      });

      onClose();
      await onDocumentDeleted();
    } catch (error) {
      toast({
        title: texts.children.errors.documentDeleteFailed.title[language],
        description: texts.children.errors.documentDeleteFailed.description[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {texts.children.documents.deleteConfirmation[language]}
          </AlertDialogHeader>
          <AlertDialogBody>{texts.children.documents.deleteMessage[language]}</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} variant="secondary" onClick={onClose}>
              {texts.common.cancel[language]}
            </Button>
            <Button variant="delete" onClick={handleDelete} ml={3} isLoading={isDeleting}>
              {texts.common.delete[language]}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default DeleteDocumentDialog;
