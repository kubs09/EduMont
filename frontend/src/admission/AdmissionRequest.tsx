import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  SimpleGrid,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { admissionService } from '../services/api/admission';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';
import { useNavigate } from 'react-router-dom';

export const AdmissionRequest = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const phoneRegex = /^\+\d{1,3}\s?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/;
  // This will match formats like:
  // +420 123 456 789
  // +420123456789
  // +420-123-456-789

  const admissionSchema = z.object({
    parentFirstName: z.string().min(1, texts.profile.validation.firstNameRequired[language]),
    parentSurname: z.string().min(1, texts.profile.validation.lastNameRequired[language]),
    parentEmail: z.string().email(texts.profile.validation.emailInvalid[language]),
    parentPhone: z
      .string()
      .optional()
      .refine((val) => !val || phoneRegex.test(val), {
        message: texts.profile.validation.invalidPhone[language],
      }),
    childFirstName: z.string().min(1, texts.profile.validation.firstNameRequired[language]),
    childSurname: z.string().min(1, texts.profile.validation.lastNameRequired[language]),
    dateOfBirth: z.string().min(1, texts.admission.form.dateOfBirth[language]),
    message: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof admissionSchema>>({
    resolver: zodResolver(admissionSchema),
  });
  const toast = useToast();

  const onSubmit = async (data: z.infer<typeof admissionSchema>) => {
    try {
      const admissionRequest = {
        firstname: data.parentFirstName,
        surname: data.parentSurname,
        email: data.parentEmail,
        phone: data.parentPhone || null, // Convert undefined to null
        child_firstname: data.childFirstName,
        child_surname: data.childSurname,
        date_of_birth: data.dateOfBirth,
        message: data.message || null, // Convert undefined to null
      };
      await admissionService.requestAdmission(admissionRequest);
      toast({
        title: texts.admission.success.title[language],
        description: texts.admission.success.description[language],
        status: 'success',
      });
      navigate('/'); // Navigate to home after successful submission
    } catch (error: unknown) {
      const errorResponse = (error as { response?: { data?: { error?: string } } })?.response?.data
        ?.error;

      let errorMessage = texts.admission.error.description[language];
      if (errorResponse === 'request_exists') {
        errorMessage = texts.admission.error.emailExists[language];
      } else if (errorResponse === 'user_exists') {
        errorMessage = texts.admission.error.userExists[language];
      }

      toast({
        title: texts.admission.error.title[language],
        description: errorMessage,
        status: 'error',
      });
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>{texts.admission.title[language]}</Heading>
        <Box w="100%" as="form" onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={6}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
              <FormControl isInvalid={!!errors.parentFirstName}>
                <FormLabel>{texts.admission.form.parentFirstName[language]}</FormLabel>
                <Input {...register('parentFirstName')} />
                <FormErrorMessage>{errors.parentFirstName?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.parentSurname}>
                <FormLabel>{texts.admission.form.parentSurname[language]}</FormLabel>
                <Input {...register('parentSurname')} />
                <FormErrorMessage>{errors.parentSurname?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
              <FormControl isInvalid={!!errors.parentEmail}>
                <FormLabel>{texts.admission.form.parentEmail[language]}</FormLabel>
                <Input {...register('parentEmail')} />
                <FormErrorMessage>{errors.parentEmail?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.parentPhone}>
                <FormLabel>{texts.admission.form.parentPhone[language]}</FormLabel>
                <Input {...register('parentPhone')} />
                <FormErrorMessage>{errors.parentPhone?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
              <FormControl isInvalid={!!errors.childFirstName}>
                <FormLabel>{texts.admission.form.childFirstName[language]}</FormLabel>
                <Input {...register('childFirstName')} />
                <FormErrorMessage>{errors.childFirstName?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.childSurname}>
                <FormLabel>{texts.admission.form.childSurname[language]}</FormLabel>
                <Input {...register('childSurname')} />
                <FormErrorMessage>{errors.childSurname?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
            <FormControl isInvalid={!!errors.dateOfBirth}>
              <FormLabel>{texts.admission.form.dateOfBirth[language]}</FormLabel>
              <Input type="date" {...register('dateOfBirth')} />
              <FormErrorMessage>{errors.dateOfBirth?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.message}>
              <FormLabel>{texts.admission.form.message[language]}</FormLabel>
              <Textarea {...register('message')} />
              <FormErrorMessage>{errors.message?.message}</FormErrorMessage>
            </FormControl>
            <Button type="submit" colorScheme="blue" size="lg" w="100%" isLoading={isSubmitting}>
              {texts.admission.form.submit[language]}
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};
