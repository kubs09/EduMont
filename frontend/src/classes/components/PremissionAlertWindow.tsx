import React from 'react';
import { Alert, Button, Stack } from '@chakra-ui/react';
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
    <Alert.Root
      status="warning"
      variant="subtle"
      flexDirection="column"
      alignItems="flex-start"
      borderRadius="md"
      gap={3}
      p={4}
    >
      <Stack direction="row" align="center" gap={3}>
        <Alert.Indicator />
        <Alert.Title>{title}</Alert.Title>
      </Stack>
      <Alert.Description>{message}</Alert.Description>
      {showAction && (
        <Button
          variant="brand"
          onClick={handleRequestPermission}
          loading={isLoading}
          loadingText={actionLabel}
          disabled={premissionSubmitted}
        >
          {premissionSubmitted
            ? texts.classes.detail.requestSentButton[language]
            : texts.classes.detail.requestPermissionButton[language]}
        </Button>
      )}
    </Alert.Root>
  );
};
