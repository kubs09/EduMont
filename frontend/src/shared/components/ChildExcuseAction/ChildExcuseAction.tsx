import { useState } from 'react';
import {
  Button,
  ButtonProps,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { DatePicker } from '@frontend/shared/components/DatePicker';
import { ChildExcuse, createChildExcuse, deleteChildExcuse } from '@frontend/services/api/child';

interface ChildExcuseActionProps {
  childId: number;
  childName: string;
  language: 'cs' | 'en';
  excuse: ChildExcuse | null;
  onRefreshExcuses: (childId: number) => Promise<void>;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
}

const ChildExcuseAction = ({
  childId,
  childName,
  language,
  excuse,
  onRefreshExcuses,
  size = 'sm',
  variant = 'outline',
}: ChildExcuseActionProps) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [excuseData, setExcuseData] = useState({
    date_from: '',
    date_to: '',
    reason: '',
  });
  const [excuseErrors, setExcuseErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const resetForm = () => {
    setExcuseData({ date_from: '', date_to: '', reason: '' });
    setExcuseErrors({});
  };

  const openModal = () => {
    resetForm();
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const validateExcuse = () => {
    const errors: Record<string, string> = {};

    if (!excuseData.date_from) {
      errors.date_from = texts.profile.children.excuse.validation.dateFromRequired[language];
    }

    if (!excuseData.date_to) {
      errors.date_to = texts.profile.children.excuse.validation.dateToRequired[language];
    }

    if (excuseData.date_from && excuseData.date_to) {
      const fromDate = new Date(excuseData.date_from);
      const toDate = new Date(excuseData.date_to);
      if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
        if (toDate < fromDate) {
          errors.date_to = texts.profile.children.excuse.validation.dateOrder[language];
        }
      }
    }

    if (!excuseData.reason.trim()) {
      errors.reason = texts.profile.children.excuse.validation.reasonRequired[language];
    }

    setExcuseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExcuseSubmit = async () => {
    if (!validateExcuse()) return;

    try {
      setIsSubmitting(true);
      await createChildExcuse(childId, {
        date_from: excuseData.date_from,
        date_to: excuseData.date_to,
        reason: excuseData.reason.trim(),
      });
      await onRefreshExcuses(childId);
      toast({
        title: texts.profile.children.excuse.success[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      closeModal();
    } catch (error) {
      const message = (error as { message?: string })?.message;
      toast({
        title: texts.profile.children.excuse.error[language],
        description: message || texts.profile.children.excuse.error[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcuseCancel = async () => {
    if (!excuse) return;

    try {
      setIsCancelling(true);
      await deleteChildExcuse(childId, excuse.id);
      await onRefreshExcuses(childId);
      toast({
        title: texts.profile.children.excuse.cancelSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const message = (error as { message?: string })?.message;
      toast({
        title: texts.profile.children.excuse.cancelError[language],
        description: message || texts.profile.children.excuse.cancelError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      {excuse ? (
        <Button size={size} variant={variant} onClick={handleExcuseCancel} isLoading={isCancelling}>
          {texts.profile.children.excuse.cancel[language]}
        </Button>
      ) : (
        <Button size={size} variant={variant} onClick={openModal}>
          {texts.profile.children.excuse.button[language]}
        </Button>
      )}
      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {texts.profile.children.excuse.title[language]}
            {childName ? ` - ${childName}` : ''}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired isInvalid={!!excuseErrors.date_from}>
                <FormLabel>{texts.profile.children.excuse.dateFrom[language]}</FormLabel>
                <DatePicker
                  viewType="day"
                  value={excuseData.date_from}
                  onChange={(date) =>
                    setExcuseData((prev) => ({
                      ...prev,
                      date_from: date,
                    }))
                  }
                  language={language}
                />
                <FormErrorMessage>{excuseErrors.date_from}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!excuseErrors.date_to}>
                <FormLabel>{texts.profile.children.excuse.dateTo[language]}</FormLabel>
                <DatePicker
                  viewType="day"
                  value={excuseData.date_to}
                  onChange={(date) =>
                    setExcuseData((prev) => ({
                      ...prev,
                      date_to: date,
                    }))
                  }
                  language={language}
                />
                <FormErrorMessage>{excuseErrors.date_to}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!excuseErrors.reason}>
                <FormLabel>{texts.profile.children.excuse.reason[language]}</FormLabel>
                <Textarea
                  value={excuseData.reason}
                  onChange={(event) =>
                    setExcuseData((prev) => ({
                      ...prev,
                      reason: event.target.value,
                    }))
                  }
                />
                <FormErrorMessage>{excuseErrors.reason}</FormErrorMessage>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={closeModal} mr={3}>
              {texts.profile.cancel[language]}
            </Button>
            <Button variant="brand" onClick={handleExcuseSubmit} isLoading={isSubmitting}>
              {texts.profile.children.excuse.submit[language]}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ChildExcuseAction;
