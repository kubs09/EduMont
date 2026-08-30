import React from 'react';
import { ButtonGroup, Dialog, DialogContentProps, DialogRootProps, Portal } from '@chakra-ui/react';

interface CustomModalProps extends Omit<DialogRootProps, 'open' | 'onOpenChange'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  buttons?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  contentProps?: DialogContentProps;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  buttons,
  onSubmit,
  contentProps,
  ...props
}) => {
  const dialogBody = (
    <>
      <Dialog.Header fontSize="lg" fontWeight="bold">
        {title}
      </Dialog.Header>
      <Dialog.CloseTrigger />
      <Dialog.Body>{children}</Dialog.Body>
      <Dialog.Footer>
        <ButtonGroup>{buttons}</ButtonGroup>
      </Dialog.Footer>
    </>
  );

  return (
    <Dialog.Root
      open={isOpen}
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
          <Dialog.Content {...contentProps}>
            {onSubmit ? <form onSubmit={onSubmit}>{dialogBody}</form> : dialogBody}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
