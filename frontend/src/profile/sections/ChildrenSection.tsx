import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { DatePicker, Section } from '@frontend/shared/components';
import { formatDate } from '@frontend/shared/components/DatePicker/utils/utils';
import {
  ChildExcuse,
  createChildExcuse,
  deleteChildExcuse,
  getChildExcuses,
  getChildren,
} from '@frontend/services/api';
import { Child } from '@frontend/types/child';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@frontend/shared/route';

interface ChildrenSectionProps {
  onOpenChildren: () => void;
  subtleBg?: string;
}

const ChildrenSection = ({ onOpenChildren, subtleBg }: ChildrenSectionProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [isExcuseOpen, setIsExcuseOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [excuseData, setExcuseData] = useState({
    date_from: '',
    date_to: '',
    reason: '',
  });
  const [excuseErrors, setExcuseErrors] = useState<Record<string, string>>({});
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);
  const [excusesByChildId, setExcusesByChildId] = useState<Record<number, ChildExcuse[]>>({});

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await getChildren();
        const items = response || [];
        setChildren(items);

        const excusesEntries = await Promise.all(
          items.map(async (child) => {
            try {
              const excuses = await getChildExcuses(child.id);
              return [child.id, excuses] as const;
            } catch (error) {
              return [child.id, []] as const;
            }
          })
        );

        setExcusesByChildId(Object.fromEntries(excusesEntries));
      } catch (error) {
        setChildren([]);
      }
    };

    fetchChildren();
  }, []);

  const refreshExcusesForChild = async (childId: number) => {
    try {
      const excuses = await getChildExcuses(childId);
      setExcusesByChildId((prev) => ({
        ...prev,
        [childId]: excuses,
      }));
    } catch (error) {
      setExcusesByChildId((prev) => ({
        ...prev,
        [childId]: [],
      }));
    }
  };

  const getDisplayExcuse = (excuses: ChildExcuse[]) => {
    if (!excuses.length) return null;

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const parseDate = (value: string) => {
      const direct = new Date(value);
      if (!Number.isNaN(direct.getTime())) return direct;
      const withTime = new Date(`${value}T00:00:00`);
      return Number.isNaN(withTime.getTime()) ? null : withTime;
    };

    const parsed = excuses
      .map((excuse) => {
        const fromDate = parseDate(excuse.date_from);
        const toDate = parseDate(excuse.date_to);
        return {
          excuse,
          fromDate,
          toDate,
        };
      })
      .filter((item) => item.fromDate && item.toDate) as Array<{
      excuse: ChildExcuse;
      fromDate: Date;
      toDate: Date;
    }>;

    if (parsed.length === 0) return excuses[0];

    const active = parsed
      .filter((item) => todayDate >= item.fromDate && todayDate <= item.toDate)
      .sort((a, b) => a.toDate.getTime() - b.toDate.getTime());

    if (active.length > 0) return active[0].excuse;

    const upcoming = parsed
      .filter((item) => item.toDate >= todayDate)
      .sort((a, b) => a.fromDate.getTime() - b.fromDate.getTime());

    if (upcoming.length > 0) return upcoming[0].excuse;

    return parsed.sort((a, b) => b.toDate.getTime() - a.toDate.getTime())[0].excuse;
  };

  const formatExcuseDate = (value: string) => {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) {
      return formatDate(direct, language);
    }
    const fallback = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(fallback.getTime())) {
      return formatDate(fallback, language);
    }
    return value;
  };

  const openExcuseModal = (child: Child) => {
    setSelectedChild(child);
    setExcuseData({ date_from: '', date_to: '', reason: '' });
    setExcuseErrors({});
    setIsExcuseOpen(true);
  };

  const closeExcuseModal = () => {
    setIsExcuseOpen(false);
    setSelectedChild(null);
    setExcuseData({ date_from: '', date_to: '', reason: '' });
    setExcuseErrors({});
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
    if (!selectedChild) return;
    if (!validateExcuse()) return;

    try {
      setIsSubmittingExcuse(true);
      await createChildExcuse(selectedChild.id, {
        date_from: excuseData.date_from,
        date_to: excuseData.date_to,
        reason: excuseData.reason.trim(),
      });
      await refreshExcusesForChild(selectedChild.id);
      toast({
        title: texts.profile.children.excuse.success[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      closeExcuseModal();
    } catch (error) {
      toast({
        title: texts.profile.children.excuse.error[language],
        description: error.message || texts.profile.children.excuse.error[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingExcuse(false);
    }
  };

  const handleExcuseCancel = async (childId: number, excuseId: number) => {
    try {
      await deleteChildExcuse(childId, excuseId);
      await refreshExcusesForChild(childId);
      toast({
        title: texts.profile.children.excuse.cancelSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: texts.profile.children.excuse.cancelError[language],
        description: error.message || texts.profile.children.excuse.cancelError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Section title={texts.profile.children.titleParent[language]} cardProps={{ mb: 6 }}>
      <Stack spacing={4}>
        {children.length > 0 ? (
          <VStack align="start" spacing={2} w="full">
            {children.map((child) => (
              <Box bg={subtleBg} p={2} borderRadius="md" w="full" key={child.id}>
                {(() => {
                  const childExcuses = excusesByChildId[child.id] || [];
                  const activeExcuse = getDisplayExcuse(childExcuses);
                  return (
                    <HStack justify="space-between" w="full">
                      <HStack spacing={2}>
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`${ROUTES.CHILDREN}/${child.id}`)}
                        >
                          {`${child.firstname} ${child.surname}`}
                        </Button>
                        {activeExcuse && (
                          <Text fontSize="sm" color="orange.500">
                            {texts.profile.children.excuse.status[language]} (
                            {formatExcuseDate(activeExcuse.date_from)}
                            {' - '}
                            {formatExcuseDate(activeExcuse.date_to)})
                          </Text>
                        )}
                      </HStack>
                      {activeExcuse ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExcuseCancel(child.id, activeExcuse.id)}
                        >
                          {texts.profile.children.excuse.cancel[language]}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => openExcuseModal(child)}>
                          {texts.profile.children.excuse.button[language]}
                        </Button>
                      )}
                    </HStack>
                  );
                })()}
              </Box>
            ))}
          </VStack>
        ) : (
          <Text color="gray.500">{texts.profile.children.noChildren[language]}</Text>
        )}
        <HStack justify="flex-start">
          <Button variant="brand" onClick={onOpenChildren}>
            {texts.profile.children.viewDashboard[language]}
          </Button>
        </HStack>
      </Stack>
      <Modal isOpen={isExcuseOpen} onClose={closeExcuseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {texts.profile.children.excuse.title[language]}
            {selectedChild ? ` - ${selectedChild.firstname} ${selectedChild.surname}` : ''}
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
            <Button variant="ghost" onClick={closeExcuseModal} mr={3}>
              {texts.profile.cancel[language]}
            </Button>
            <Button variant="brand" onClick={handleExcuseSubmit} isLoading={isSubmittingExcuse}>
              {texts.profile.children.excuse.submit[language]}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Section>
  );
};

export default ChildrenSection;
