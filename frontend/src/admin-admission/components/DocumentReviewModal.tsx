import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Link,
  Spinner,
  useToast,
  Box,
} from '@chakra-ui/react';
import { admissionService } from '@frontend/services/api/admission';
import { texts } from '@frontend/texts';
import { AdminDocument } from '@frontend/types/admission';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  stepId: number;
  language: 'cs' | 'en';
  onReviewComplete?: () => void; // Add this prop
}

export const DocumentReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userId,
  stepId,
  language,
  onReviewComplete, // Add this prop
}) => {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const t = texts.adminAdmissions.documentReview;

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await admissionService.getAdminDocuments(userId, stepId);
        setDocuments(docs);
      } catch (error) {
        toast({
          title: t.error.fetch[language],
          status: 'error',
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen, userId, stepId, toast, t.error.fetch, language]);

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      const blob = await admissionService.downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: t.error.download[language],
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleApprove = async () => {
    try {
      await admissionService.reviewSubmission(userId, stepId, {
        status: 'approved',
        adminNotes: '', // Add notes if needed
      });
      onReviewComplete?.(); // Call the callback when approved
      onClose();
    } catch (error) {
      toast({
        title: t.error.review[language],
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeny = async () => {
    try {
      await admissionService.reviewSubmission(userId, stepId, {
        status: 'rejected',
        adminNotes: '', // Add notes if needed
      });
      onReviewComplete?.(); // Call the callback when denied
      onClose();
    } catch (error) {
      toast({
        title: t.error.review[language],
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t.title[language]}</ModalHeader>
        <ModalBody>
          {isLoading ? (
            <Box textAlign="center">
              <Spinner />
            </Box>
          ) : documents.length === 0 ? (
            <Text>{t.noDocuments[language]}</Text>
          ) : (
            <VStack align="stretch" spacing={4}>
              {documents.map((doc) => (
                <Box key={doc.id} p={3} borderWidth={1} borderRadius="md">
                  <Text fontWeight="bold">{doc.document_type}</Text>
                  <Text fontSize="sm">{doc.original_name}</Text>
                  {doc.description && <Text fontSize="sm">{doc.description}</Text>}
                  <Link
                    color="blue.500"
                    onClick={() => handleDownload(doc.id, doc.original_name)}
                    cursor="pointer"
                  >
                    {t.download[language]}
                  </Link>
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={handleApprove}>
            {texts.adminAdmissions.approve[language]}
          </Button>
          <Button colorScheme="red" onClick={handleDeny}>
            {texts.adminAdmissions.deny[language]}
          </Button>
          <Button onClick={onClose}>{t.close[language]}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
