import React from 'react';
import { Button, Dialog, Portal } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import api from '@frontend/services/apiConfig';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

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
  language,
  onDocumentDeleted,
}) => {
  const cancelRef = React.useRef(null);
  const toast = useAppToast();
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
    } catch {
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
    <Dialog.Root
      open={isOpen}
      initialFocusEl={() => cancelRef.current}
      role='alertdialog'
      onOpenChange={e => {
        if (!e.open) {
          onClose();
        }
      }}>
      <Portal>

        <Dialog.Backdrop>
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header fontSize="lg" fontWeight="bold">
                {texts.children.documents.deleteConfirmation[language]}
              </Dialog.Header>
              <Dialog.Body>{texts.children.documents.deleteMessage[language]}</Dialog.Body>
              <Dialog.Footer>
                <Button ref={cancelRef} variant="secondary" onClick={onClose}>
                  {texts.common.cancel[language]}
                </Button>
                <Button variant="delete" onClick={handleDelete} ml={3} loading={isDeleting}>
                  {texts.common.delete[language]}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Backdrop>

      </Portal>
    </Dialog.Root>
  );
};

export default DeleteDocumentDialog;
