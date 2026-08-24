import React from 'react';
import { CustomDialog } from '@frontend/shared/ui/dialog';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  confirmColorScheme?: string;
  leastDestructiveRef?: React.RefObject<HTMLButtonElement | null>;
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
  <CustomDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={title}
    cancelLabel={cancelLabel}
    confirmLabel={confirmLabel}
    confirmColorScheme={confirmColorScheme}
    cancelRef={leastDestructiveRef}
    isConfirmLoading={isConfirmLoading}
  >
    {message}
  </CustomDialog>
);

export default ConfirmDialog;
