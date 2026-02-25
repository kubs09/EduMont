import React from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, Stack } from '@chakra-ui/react';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import texts from '@frontend/texts';

type PermissionAlertWindowProps = {
  title: string;
  message: string;
  onRequestPermission?: () => void;
  actionLabel?: string;
  submittedLabel?: string;
  isLoading?: boolean;
  premissionSubmitted?: boolean;
};

export const PermissionAlertWindow: React.FC<PermissionAlertWindowProps> = ({
  title,
  message,
  onRequestPermission,
  actionLabel,
  premissionSubmitted = false,
  isLoading = false,
}) => {
  const showAction = !!onRequestPermission && !!actionLabel;
  const { language } = useLanguage();

  const handleRequestPermission = () => {
    if (premissionSubmitted) return;
    onRequestPermission?.();
  };

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
          onClick={handleRequestPermission}
          isLoading={isLoading}
          loadingText={actionLabel}
          isDisabled={premissionSubmitted}
        >
          {premissionSubmitted
            ? texts.classes.detail.requestSentButton[language]
            : texts.classes.detail.requestPermissionButton[language]}
        </Button>
      )}
    </Alert>
  );
};
