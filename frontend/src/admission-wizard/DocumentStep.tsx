import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Progress,
  useToast,
  AlertTitle,
} from '@chakra-ui/react';
import { DocumentConfig, DocumentSubmission, DocumentRecord } from '../types/admission';
import { admissionService } from '../services/api/admission';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '../texts';

type DocumentType = 'id_front' | 'id_back' | 'birth_certificate' | 'medical_approval' | 'other';

const defaultDocumentConfigs: DocumentConfig[] = [
  {
    type: 'id_front',
    required: true,
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  {
    type: 'id_back',
    required: true,
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024,
  },
  {
    type: 'birth_certificate',
    required: true,
    allowedTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  {
    type: 'medical_approval',
    required: true,
    allowedTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxSize: 10 * 1024 * 1024,
  },
];

// Helper function to get document label
const getDocumentLabel = (
  type: DocumentType,
  t: typeof texts.admission.documents,
  language: 'cs' | 'en'
): string => {
  if (type === 'other') {
    return t.otherDocuments[language];
  }
  return t[type]?.[language] || type;
};

interface Props {
  onComplete: () => void;
  stepId: number;
}

export const DocumentStep: React.FC<Props> = ({ onComplete, stepId }) => {
  const { language } = useLanguage();
  const t = texts.admission.documents;
  const toast = useToast();
  const [documents, setDocuments] = useState<DocumentRecord>({
    id_front: null,
    id_back: null,
    birth_certificate: null,
    medical_approval: null,
    other: null,
  });
  const [otherDocs, setOtherDocs] = useState<DocumentSubmission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const handleFileChange = (type: DocumentType, file: File) => {
    const config = defaultDocumentConfigs.find((c) => c.type === type);
    if (!config) return;

    if (!config.allowedTypes.includes(file.type)) {
      toast({
        title: t.invalidType[language],
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (file.size > config.maxSize) {
      toast({
        title: t.fileTooLarge[language],
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setDocuments((prev) => ({
      ...prev,
      [type]: { type, file },
    }));
  };

  const handleOtherFileAdd = (file: File, description: string) => {
    setOtherDocs((prev) => [...prev, { type: 'other', file, description }]);
  };

  const uploadFile = async (file: File, type: string, description?: string) => {
    const formData = new FormData();
    formData.append('document', file, file.name);
    formData.append('documentType', type);
    if (description) {
      formData.append('description', description);
    }

    console.log('Uploading:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      docType: type,
    });

    await admissionService.submitStep(stepId, formData);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate required documents
    const missingRequired = defaultDocumentConfigs.filter(
      (config) => config.required && !documents[config.type]
    );

    if (missingRequired.length > 0) {
      toast({
        title: t.missingRequired[language],
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Process one file at a time
      let success = 0;

      for (const [type, submission] of Object.entries(documents)) {
        if (submission?.file) {
          await uploadFile(submission.file, type);
          success++;
        }
      }

      for (const doc of otherDocs) {
        await uploadFile(doc.file, 'other', doc.description);
        success++;
      }

      if (success > 0) {
        toast({
          title: t.submitSuccess[language],
          status: 'success',
          duration: 3000,
        });
        onComplete();
      }
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const apiError = (error as { response?: { data?: { error?: string } } })?.response?.data
        ?.error;
      toast({
        title: t.submitError[language],
        description: apiError || errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsSubmitting(false);
    setIsResubmitting(true);
    setDocuments({
      id_front: null,
      id_back: null,
      birth_certificate: null,
      medical_approval: null,
      other: null,
    });
    setOtherDocs([]);
  };

  if (isSubmitting && !isResubmitting) {
    return (
      <VStack spacing={6} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>{t.submitting[language]}</AlertTitle>
          </Box>
          <Button onClick={handleCancel}>{t.cancel[language]}</Button>
        </Alert>
        <Progress size="xs" isIndeterminate />
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {isResubmitting && (
        <Alert status="info">
          <AlertIcon />
          {t.resubmitMessage[language]}
        </Alert>
      )}

      <Text fontSize="xl" fontWeight="bold">
        {t.title[language]}
      </Text>

      {defaultDocumentConfigs.map((config) => (
        <FormControl key={config.type} isRequired={config.required}>
          <FormLabel>{getDocumentLabel(config.type, t, language)}</FormLabel>
          <Input
            type="file"
            accept={config.allowedTypes.join(',')}
            onChange={(e) => e.target.files && handleFileChange(config.type, e.target.files[0])}
          />
          {documents[config.type] && (
            <Text fontSize="sm" color="green.500">
              {t.fileSelected[language]}: {documents[config.type]?.file.name}
            </Text>
          )}
        </FormControl>
      ))}

      <Box>
        <Text fontWeight="bold" mb={2}>
          {t.otherDocuments[language]}
        </Text>
        <Input
          type="file"
          onChange={(e) => e.target.files && handleOtherFileAdd(e.target.files[0], '')}
        />
      </Box>

      {otherDocs.map((doc, index) => (
        <Alert key={index} status="info">
          <AlertIcon />
          <Text>{doc.file.name}</Text>
          <Button
            size="sm"
            ml="auto"
            onClick={() => setOtherDocs((prev) => prev.filter((_, i) => i !== index))}
          >
            {t.remove[language]}
          </Button>
        </Alert>
      ))}

      <Button
        colorScheme="blue"
        onClick={handleSubmit}
        isLoading={isSubmitting}
        loadingText={t.submitting[language]}
      >
        {isResubmitting ? t.resubmit[language] : t.submit[language]}
      </Button>

      {isSubmitting && <Progress size="xs" isIndeterminate />}
    </VStack>
  );
};
