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
  const toast = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/api/category-presentations/${presentationId}`);

      toast({
        title: texts.profile.success[language],
        description: texts.schedule.messages.deleteSuccess[language],
        status: 'success',
        duration: 3000,
      });

      onClose();
      await onPresentationDeleted();
    } catch (error) {
      toast({
        title: texts.profile.error[language],
        description: texts.schedule.messages.deleteError[language],
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
            {texts.schedule.curriculum.deletePresentation[language]}
          </AlertDialogHeader>
          <AlertDialogBody>{texts.schedule.messages.deleteConfirmation[language]}</AlertDialogBody>
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

export default DeletePresentationDialog;
