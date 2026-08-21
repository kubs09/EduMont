import React from 'react';
import { Button, Dialog, Portal } from '@chakra-ui/react';

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
  <Dialog.Root
    open={isOpen}
    initialFocusEl={() => leastDestructiveRef?.current ?? null}
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
            <Dialog.Header>{title}</Dialog.Header>
            <Dialog.Body>{message}</Dialog.Body>
            <Dialog.Footer>
              <Button ref={leastDestructiveRef} onClick={onClose}>
                {cancelLabel}
              </Button>
              <Button
                colorPalette={confirmColorScheme}
                onClick={onConfirm}
                ml={3}
                loading={isConfirmLoading}
              >
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Backdrop>

    </Portal>
</Dialog.Root>
);

export default ConfirmDialog;
