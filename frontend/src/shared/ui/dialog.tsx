import React from 'react';
import { Button, ButtonProps, Dialog, DialogRootProps, Portal } from '@chakra-ui/react';

interface CustomDialogProps extends Omit<DialogRootProps, 'open' | 'onOpenChange'> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  confirmColorScheme?: string;
  cancelVariant?: ButtonProps['variant'];
  confirmVariant?: ButtonProps['variant'];
  cancelRef?: React.RefObject<HTMLButtonElement | null>;
  isConfirmLoading?: boolean;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  cancelLabel,
  confirmLabel,
  confirmColorScheme = 'red',
  cancelVariant,
  confirmVariant,
  cancelRef,
  isConfirmLoading,
  ...props
}) => {
  return (
    <Dialog.Root
      open={isOpen}
      initialFocusEl={() => cancelRef?.current ?? null}
      role="alertdialog"
      onOpenChange={(e) => {
        if (!e.open) {
          onClose();
        }
      }}
      {...props}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header fontSize="lg" fontWeight="bold">
              {title}
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            <Dialog.Footer>
              <Button ref={cancelRef} variant={cancelVariant} onClick={onClose}>
                {cancelLabel}
              </Button>
              <Button
                colorPalette={confirmColorScheme}
                variant={confirmVariant}
                onClick={onConfirm}
                ml={3}
                loading={isConfirmLoading}
              >
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
