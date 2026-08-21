import React from 'react';
import { Button, Dialog, Portal } from '@chakra-ui/react';
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
                {texts.schedule.curriculum.deletePresentation[language]}
              </Dialog.Header>
              <Dialog.Body>
                {texts.schedule.curriculum.deleteConfirmMessage[language]}
              </Dialog.Body>
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

export default DeletePresentationDialog;
