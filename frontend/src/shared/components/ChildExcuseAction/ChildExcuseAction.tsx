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
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { DatePicker } from '@frontend/shared/components/DatePicker';
import { ChildExcuse, createChildExcuse, updateChildExcuse } from '@frontend/services/api/child';

interface ChildExcuseActionProps {
  childId: number;
  childName: string;
  language: 'cs' | 'en';
  excuse?: ChildExcuse | null;
  onRefreshExcuses: (childId: number) => Promise<void>;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  buttonText?: string;
}

const ChildExcuseAction = ({
  childId,
  childName,
  language,
  excuse = null,
  onRefreshExcuses,
  size = 'sm',
  variant = 'outline',
  buttonText,
}: ChildExcuseActionProps) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
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
    setExcuseErrors({});
    if (excuse) {
      setExcuseData({
        date_from: excuse.date_from,
        date_to: excuse.date_to,
        reason: excuse.reason,
      });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const validateExcuse = () => {
    const errors: Record<string, string> = {};

    if (!excuseData.date_from) {
      errors.date_from = texts.children.validation.excuseDateFromRequired[language];
    }

    if (!excuseData.date_to) {
      errors.date_to = texts.children.validation.excuseDateToRequired[language];
    }

    if (excuseData.date_from && excuseData.date_to) {
      const fromDate = new Date(excuseData.date_from);
      const toDate = new Date(excuseData.date_to);
      if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
        if (toDate < fromDate) {
          errors.date_to = texts.children.validation.excuseDateOrder[language];
        }
      }
    }

    if (!excuseData.reason.trim()) {
      errors.reason = texts.children.validation.excuseReasonRequired[language];
    }

    setExcuseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExcuseSubmit = async () => {
    if (!validateExcuse()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        date_from: excuseData.date_from,
        date_to: excuseData.date_to,
        reason: excuseData.reason.trim(),
      };
      if (excuse) {
        await updateChildExcuse(childId, excuse.id, payload);
      } else {
        await createChildExcuse(childId, payload);
      }
      await onRefreshExcuses(childId);
      toast({
        title: texts.children.success.excuseSubmitted[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      closeModal();
    } catch (error) {
      const message = (error as { message?: string })?.message;
      toast({
        title: texts.children.errors.excuseSubmitFailed[language],
        description: message || texts.children.errors.excuseSubmitFailed[language],
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
    onConfirmOpen();
  };

  const getLocalDateIso = () => {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    const localIso = new Date(today.getTime() - timezoneOffset).toISOString().split('T')[0];
    return localIso;
  };

  const handleConfirmDelete = async () => {
    if (!excuse) return;
    try {
      setIsCancelling(true);
      const today = getLocalDateIso();

      const dateFrom = excuse.date_from.includes('T')
        ? excuse.date_from.split('T')[0]
        : excuse.date_from;

      const adjustedDateFrom = dateFrom > today ? today : dateFrom;

      await updateChildExcuse(childId, excuse.id, {
        date_from: adjustedDateFrom,
        date_to: today,
        reason: excuse.reason,
      });
      await onRefreshExcuses(childId);
      toast({
        title: texts.children.success.excuseCancelled[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onConfirmClose();
    } catch (error) {
      const message = (error as { message?: string })?.message;
      toast({
        title: texts.children.errors.excuseCancelFailed[language],
        description: message || texts.children.errors.excuseCancelFailed[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const canEndExcuse =
    excuse &&
    (() => {
      const today = getLocalDateIso();
      const dateTo = excuse.date_to.includes('T') ? excuse.date_to.split('T')[0] : excuse.date_to;
      return dateTo > today;
    })();

  const canEditExcuse =
    excuse &&
    (() => {
      const today = getLocalDateIso();
      const dateTo = excuse.date_to.includes('T') ? excuse.date_to.split('T')[0] : excuse.date_to;
      return dateTo >= today;
    })();

  const displayText =
    buttonText ||
    (excuse
      ? texts.children.excuse.excuseEditButton[language]
      : texts.children.excuse.excuseButton[language]);

  return (
    <>
      {(!excuse || canEditExcuse) && (
        <Button size={size} variant={variant} onClick={openModal}>
          {displayText}
        </Button>
      )}
      {excuse && canEndExcuse && (
        <Button size={size} variant="secondary" onClick={handleExcuseCancel} ml={2}>
          {texts.children.excuse.excuseEndButton[language]}
        </Button>
      )}
      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {texts.children.excuse.title[language]}
            {childName ? ` - ${childName}` : ''}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired isInvalid={!!excuseErrors.date_from}>
                <FormLabel>{texts.children.excuse.dateFrom[language]}</FormLabel>
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
                <FormLabel>{texts.children.excuse.dateTo[language]}</FormLabel>
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
                <FormLabel>{texts.children.excuse.reason[language]}</FormLabel>
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
              {texts.children.excuse.submit[language]}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{texts.children.excuse.cancelConfirmTitle[language]}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{texts.children.excuse.cancelConfirmMessage[language]}</ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={onConfirmClose} mr={3}>
              {texts.children.excuse.keep[language]}
            </Button>
            <Button variant="brand" onClick={handleConfirmDelete} isLoading={isCancelling}>
              {texts.children.excuse.excuseEndButton[language]}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ChildExcuseAction;
