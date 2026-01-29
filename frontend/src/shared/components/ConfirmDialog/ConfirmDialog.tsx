import React from 'react';
import { FocusableElement } from '@chakra-ui/utils';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  confirmColorScheme?: string;
  leastDestructiveRef?: React.RefObject<HTMLButtonElement>;
  isConfirmLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmColorScheme = 'red',
  leastDestructiveRef,
  isConfirmLoading,
}) => (
  <AlertDialog
    isOpen={isOpen}
    leastDestructiveRef={leastDestructiveRef as React.RefObject<FocusableElement>}
    onClose={onClose}
  >
    <AlertDialogOverlay>
      <AlertDialogContent>
        <AlertDialogHeader>{title}</AlertDialogHeader>
        <AlertDialogBody>{message}</AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={leastDestructiveRef} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            colorScheme={confirmColorScheme}
            onClick={onConfirm}
            ml={3}
            isLoading={isConfirmLoading}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogOverlay>
  </AlertDialog>
);

export default ConfirmDialog;
