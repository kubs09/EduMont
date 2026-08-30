import React from 'react';
import { CustomDialog } from '@frontend/shared/ui/dialog';
import { texts } from '@frontend/texts';
import api from '@frontend/services/apiConfig';
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

interface DeletePresentationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: number;
  language: 'cs' | 'en';
  onPresentationDeleted: () => Promise<void>;
}

const DeletePresentationDialog: React.FC<DeletePresentationDialogProps> = ({
  isOpen,
  onClose,
  presentationId,
  language,
  onPresentationDeleted,
}) => {
  const cancelRef = React.useRef(null);
  const toast = useAppToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/api/presentations/categories/${presentationId}`);

      toast({
        title: texts.schedule.success.deleted[language],
        status: 'success',
        duration: 3000,
      });

      onClose();
      await onPresentationDeleted();
    } catch {
      toast({
        title: texts.schedule.errors.deleteFailed.title[language],
        description: texts.schedule.errors.deleteFailed.description[language],
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
      title={texts.schedule.curriculum.deletePresentation[language]}
      cancelLabel={texts.common.cancel[language]}
      confirmLabel={texts.common.delete[language]}
      cancelRef={cancelRef}
      cancelVariant="secondary"
      confirmVariant="delete"
      isConfirmLoading={isDeleting}
    >
      {texts.schedule.curriculum.deleteConfirmMessage[language]}
    </CustomDialog>
  );
};

export default DeletePresentationDialog;
