import React from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, Stack } from '@chakra-ui/react';

type PermissionAlertWindowProps = {
  title: string;
  message: string;
  onRequestPermission?: () => void;
  actionLabel?: string;
  isLoading?: boolean;
};

export const PermissionAlertWindow: React.FC<PermissionAlertWindowProps> = ({
  title,
  message,
  onRequestPermission,
  actionLabel,
  isLoading = false,
}) => {
  const showAction = !!onRequestPermission && !!actionLabel;

  return (
    <Alert
      status="warning"
      variant="subtle"
      flexDirection="column"
      alignItems="flex-start"
      borderRadius="md"
      gap={3}
      p={4}
    >
      <Stack direction="row" align="center" spacing={3}>
        <AlertIcon />
        <AlertTitle>{title}</AlertTitle>
      </Stack>
      <AlertDescription>{message}</AlertDescription>
      {showAction && (
        <Button
          colorScheme="blue"
          onClick={onRequestPermission}
          isLoading={isLoading}
          loadingText={actionLabel}
        >
          {actionLabel}
        </Button>
      )}
    </Alert>
  );
};
