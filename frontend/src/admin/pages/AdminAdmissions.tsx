import {
  Box,
  Button,
  Container,
  Heading,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import {
  admissionService,
  AdmissionRequestDetails,
  PendingAdmissionUser,
} from '../../services/api/admission';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { texts } from '../../texts';
import { inviteUser } from '../../services/api/users';
import { AdminAdmissionRequestsTable } from '../components/AdminAdmissionRequestsTable';
import { AdminParentsInProgressTable } from '../components/AdminParentsInProgressTable';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
    status?: number;
  };
}

const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export const AdminAdmissions = () => {
  const [admissions, setAdmissions] = useState<AdmissionRequestDetails[]>([]);
  const [registeredParents, setRegisteredParents] = useState<PendingAdmissionUser[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRequestDetails | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { language } = useLanguage();

  const fetchData = useCallback(async () => {
    try {
      const [admissionsData, parentsData] = await Promise.all([
        admissionService.getAdmissionRequests(),
        admissionService.getPendingAdmissionUsers(),
      ]);
      setAdmissions(admissionsData);
      setRegisteredParents(parentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admission data',
        status: 'error',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (admission: AdmissionRequestDetails) => {
    try {
      await admissionService.approveAdmission(admission.id);
      try {
        await inviteUser({
          email: admission.email,
          role: 'parent',
          language: 'cs',
          admissionId: admission.id,
        });
        toast({
          title: 'Success',
          description: 'Admission approved and invitation sent',
          status: 'success',
          duration: 5000,
        });
      } catch (inviteError) {
        const apiError = inviteError as ApiError;
        if (apiError.response?.data?.error === 'user_exists') {
          toast({
            title: 'Success',
            description: 'Admission approved (user already exists)',
            status: 'success',
            duration: 5000,
          });
        } else {
          toast({
            title: 'Partial Success',
            description: 'Admission approved but invitation failed to send',
            status: 'warning',
            duration: 5000,
          });
        }
      }

      fetchData();
    } catch (error) {
      console.error('Error approving admission:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve admission. Please try again.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeny = (admission: AdmissionRequestDetails) => {
    setSelectedAdmission(admission);
    onOpen();
  };

  const submitDenial = async () => {
    if (!selectedAdmission || !denialReason.trim()) return;

    try {
      await admissionService.denyAdmission(selectedAdmission.id, denialReason);
      toast({
        title: 'Success',
        description: 'Admission denied',
        status: 'success',
        duration: 5000,
      });
      onClose();
      setDenialReason('');
      setSelectedAdmission(null);
      fetchData();
    } catch (error) {
      console.error('Error denying admission:', error);
      toast({
        title: 'Error',
        description: 'Failed to deny admission. Please try again.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colorScheme = {
      pending: 'yellow',
      approved: 'green',
      denied: 'red',
    }[status];

    return <Badge colorScheme={colorScheme}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>{texts.adminAdmissions.name[language]}</Heading>
      <Tabs>
        <TabList>
          <Tab>{texts.adminAdmissions.requests[language]}</Tab>
          <Tab>{texts.adminAdmissions.process[language]}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Box overflowX="auto">
              <AdminAdmissionRequestsTable
                admissions={admissions}
                onApprove={handleApprove}
                onDeny={handleDeny}
                calculateAge={calculateAge}
                getStatusBadge={getStatusBadge}
                language={language}
                texts={{
                  table: texts.adminAdmissions.table,
                  approve: texts.adminAdmissions.approve,
                  deny: texts.adminAdmissions.deny,
                }}
              />
            </Box>
          </TabPanel>
          <TabPanel>
            <Box overflowX="auto">
              <AdminParentsInProgressTable
                parents={registeredParents}
                getStatusBadge={getStatusBadge}
                language={language}
                texts={{
                  table: {
                    parent: texts.adminAdmissions.table.parent,
                    email: texts.adminAdmissions.table.email,
                    step: texts.adminAdmissions.table.step,
                    status: texts.adminAdmissions.table.status,
                    actions: texts.adminAdmissions.table.actions,
                    viewProgress: texts.adminAdmissions.table.viewProgress,
                  },
                }}
              />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{texts.adminAdmissions.denyModal.title[language]}</ModalHeader>
          <ModalBody>
            <Text mb={4}>
              {texts.adminAdmissions.denyModal.reasonPrompt[language]}{' '}
              <strong>{selectedAdmission?.firstname}</strong>
            </Text>
            <Textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder={texts.adminAdmissions.denyModal.reasonPlaceholder[language]}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {texts.adminAdmissions.denyModal.cancel[language]}
            </Button>
            <Button colorScheme="red" onClick={submitDenial} isDisabled={!denialReason.trim()}>
              {texts.adminAdmissions.denyModal.confirm[language]}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AdminAdmissions;
