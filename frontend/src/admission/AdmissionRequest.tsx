import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
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

interface AdmissionRequestForm {
  parentFirstName: string;
  parentSurname: string;
  parentEmail: string;
  parentPhone: string;
  childFirstName: string;
  childSurname: string;
  dateOfBirth: string;
  message: string;
}

export const AdmissionRequest = () => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AdmissionRequestForm>();
  const toast = useToast();
  const { language } = useLanguage();

  const onSubmit = async (data: AdmissionRequestForm) => {
    try {
      const admissionRequest = {
        firstname: data.parentFirstName,
        surname: data.parentSurname,
        email: data.parentEmail,
        phone: data.parentPhone,
        child_firstname: data.childFirstName,
        child_surname: data.childSurname,
        date_of_birth: data.dateOfBirth,
        message: data.message,
      };
      await admissionService.requestAdmission(admissionRequest);
      toast({
        title: texts.admission.success.title[language],
        description: texts.admission.success.description[language],
        status: 'success',
      });
    } catch (error) {
      toast({
        title: texts.admission.error.title[language],
        description: texts.admission.error.description[language],
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
              <FormControl isRequired>
                <FormLabel>{texts.admission.form.parentFirstName[language]}</FormLabel>
                <Input {...register('parentFirstName')} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{texts.admission.form.parentSurname[language]}</FormLabel>
                <Input {...register('parentSurname')} />
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
              <FormControl isRequired>
                <FormLabel>{texts.admission.form.parentEmail[language]}</FormLabel>
                <Input type="email" {...register('parentEmail')} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{texts.admission.form.parentPhone[language]}</FormLabel>
                <Input {...register('parentPhone')} />
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
              <FormControl isRequired>
                <FormLabel>{texts.admission.form.childFirstName[language]}</FormLabel>
                <Input {...register('childFirstName')} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{texts.admission.form.childSurname[language]}</FormLabel>
                <Input {...register('childSurname')} />
              </FormControl>
            </SimpleGrid>
            <FormControl isRequired>
              <FormLabel>{texts.admission.form.dateOfBirth[language]}</FormLabel>
              <Input type="date" {...register('dateOfBirth')} />
            </FormControl>
            <FormControl>
              <FormLabel>{texts.admission.form.message[language]}</FormLabel>
              <Textarea {...register('message')} />
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
