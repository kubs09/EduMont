import React from 'react';
import { CustomDialog } from '@frontend/shared/ui/dialog';
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
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title={texts.children.documents.deleteConfirmation[language]}
      cancelLabel={texts.common.cancel[language]}
      confirmLabel={texts.common.delete[language]}
      cancelRef={cancelRef}
      cancelVariant="secondary"
      confirmVariant="delete"
      isConfirmLoading={isDeleting}
    >
      {texts.children.documents.deleteMessage[language]}
    </CustomDialog>
  );
};

export default DeleteDocumentDialog;
