import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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

  const renderAdmissionRequestsTable = () => (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>{texts.adminAdmissions.table.name[language]}</Th>
          <Th>{texts.adminAdmissions.table.parent[language]}</Th>
          <Th>{texts.adminAdmissions.table.email[language]}</Th>
          <Th>{texts.adminAdmissions.table.phone[language]}</Th>
          <Th>{texts.adminAdmissions.table.date[language]}</Th>
          <Th>{texts.adminAdmissions.table.age[language]}</Th>
          <Th>{texts.adminAdmissions.table.status[language]}</Th>
          <Th>{texts.adminAdmissions.table.actions[language]}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {admissions
          .filter((admission) => ['pending', 'approved', 'invited'].includes(admission.status))
          .map((admission) => (
            <Tr key={admission.id}>
              <Td>{`${admission.child_firstname} ${admission.child_surname}`}</Td>
              <Td>{`${admission.firstname} ${admission.surname}`}</Td>
              <Td>{admission.email}</Td>
              <Td>{admission.phone}</Td>
              <Td>{new Date(admission.date_of_birth).toLocaleDateString()}</Td>
              <Td>{calculateAge(admission.date_of_birth)}</Td>
              <Td>{getStatusBadge(admission.status)}</Td>
              <Td>
                {admission.status === 'pending' && (
                  <Box>
                    <Button
                      size="sm"
                      colorScheme="green"
                      mr={2}
                      onClick={() => handleApprove(admission)}
                    >
                      {texts.adminAdmissions.approve[language]}
                    </Button>
                    <Button size="sm" colorScheme="red" onClick={() => handleDeny(admission)}>
                      {texts.adminAdmissions.deny[language]}
                    </Button>
                  </Box>
                )}
              </Td>
            </Tr>
          ))}
      </Tbody>
    </Table>
  );

  const renderParentsInProgressTable = () => (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>{texts.adminAdmissions.table.parent[language]}</Th>
          <Th>{texts.adminAdmissions.table.email[language]}</Th>
          <Th>{texts.adminAdmissions.table.step[language]}</Th>
          <Th>{texts.adminAdmissions.table.status[language]}</Th>
          <Th>{texts.adminAdmissions.table.actions[language]}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {registeredParents.map((parent) => (
          <Tr key={parent.id}>
            <Td>{`${parent.firstname} ${parent.surname}`}</Td>
            <Td>{parent.email}</Td>
            <Td>{parent.current_step.name}</Td>
            <Td>{getStatusBadge(parent.current_step.status)}</Td>
            <Td>
              <Button size="sm" colorScheme="blue">
                View Progress
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

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
            <Box overflowX="auto">{renderAdmissionRequestsTable()}</Box>
          </TabPanel>
          <TabPanel>
            <Box overflowX="auto">{renderParentsInProgressTable()}</Box>
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
              Cancel
            </Button>
            <Button colorScheme="red" onClick={submitDenial} isDisabled={!denialReason.trim()}>
              Confirm Denial
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AdminAdmissions;
