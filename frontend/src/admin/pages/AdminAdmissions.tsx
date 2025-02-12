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
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { admissionService, AdmissionRequestDetails } from '../../services/api/admission';
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
  const [selectedAdmission, setSelectedAdmission] = useState<AdmissionRequestDetails | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchAdmissions = useCallback(async () => {
    try {
      const data = await admissionService.getAdmissionRequests();
      if (Array.isArray(data)) {
        setAdmissions(data);
      } else {
        console.error('Unexpected data format:', data);
        toast({
          title: 'Error',
          description: 'Received invalid data format from server',
          status: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admission requests',
        status: 'error',
        duration: 5000,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  const handleApprove = async (admission: AdmissionRequestDetails) => {
    try {
      await admissionService.approveAdmission(admission.id);

      // After approval, send invitation
      try {
        await inviteUser({
          email: admission.email,
          role: 'parent',
          language: 'cs', // You can make this dynamic based on user preference
        });

        toast({
          title: 'Success',
          description: 'Admission approved and invitation sent',
          status: 'success',
          duration: 5000,
        });
      } catch (inviteError) {
        // If invitation fails, show a specific error but don't revert the approval
        if ((inviteError as ApiError)?.response?.data?.error === 'user_exists') {
          toast({
            title: 'Note',
            description: 'User already exists in the system',
            status: 'info',
            duration: 5000,
          });
        } else if ((inviteError as ApiError)?.response?.data?.error === 'invitation_exists') {
          toast({
            title: 'Note',
            description: 'An invitation has already been sent',
            status: 'info',
            duration: 5000,
          });
        } else {
          toast({
            title: 'Warning',
            description: 'Admission approved but failed to send invitation',
            status: 'warning',
            duration: 5000,
          });
        }
      }

      fetchAdmissions();
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

  // Add new function to resend invitation
  const handleResendInvitation = async (admission: AdmissionRequestDetails) => {
    try {
      await inviteUser({
        email: admission.email,
        role: 'parent',
        language: 'cs', // You can make this dynamic based on user preference
      });

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      if ((error as ApiError)?.response?.data?.error === 'user_exists') {
        toast({
          title: 'Error',
          description: 'User already exists in the system',
          status: 'error',
          duration: 5000,
        });
      } else if ((error as ApiError)?.response?.data?.error === 'invitation_exists') {
        toast({
          title: 'Error',
          description: 'An invitation has already been sent',
          status: 'error',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send invitation',
          status: 'error',
          duration: 5000,
        });
      }
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
      fetchAdmissions();
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
      <Heading mb={6}>Admission Requests</Heading>
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Child Name</Th>
              <Th>Parent Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Date of Birth</Th>
              <Th>Age</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {admissions.map((admission) => (
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
                        Approve
                      </Button>
                      <Button size="sm" colorScheme="red" onClick={() => handleDeny(admission)}>
                        Deny
                      </Button>
                    </Box>
                  )}
                  {admission.status === 'approved' && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleResendInvitation(admission)}
                    >
                      Resend Invitation
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Deny Admission</ModalHeader>
          <ModalBody>
            <Text mb={4}>
              Please provide a reason for denying the admission request for{' '}
              <strong>{selectedAdmission?.firstname}</strong>
            </Text>
            <Textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Enter denial reason..."
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
