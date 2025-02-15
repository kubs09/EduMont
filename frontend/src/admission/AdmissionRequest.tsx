import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
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
  Text,
  HStack,
  Circle,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { admissionService } from '../services/api/admission';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Language } from '@frontend/services/languageService';

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <HStack spacing={1}>
    <Text>{children}</Text>
    <Text color="red.500">*</Text>
  </HStack>
);

const GradientHeading = ({ children }: { children: React.ReactNode }) => (
  <Heading
    size="lg"
    bgGradient="linear(to-r, blue.600, purple.700)"
    bgClip="text"
    letterSpacing="tight"
    fontWeight="bold"
  >
    {children}
  </Heading>
);

const SectionCard = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <Card
    variant="outline"
    w="100%"
    p={{ base: 2, md: 4 }}
    bg="white"
    borderWidth="1px"
    borderRadius="lg"
    boxShadow="lg"
    _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}
  >
    <VStack align="stretch" spacing={{ base: 3, md: 6 }}>
      <Heading
        size={{ base: 'xs', md: 'sm' }}
        bgGradient="linear(to-r, teal.400, blue.500)"
        bgClip="text"
        letterSpacing="wide"
      >
        {title}
      </Heading>
      {children}
    </VStack>
  </Card>
);

const StepIndicator = ({ currentStep, language }: { currentStep: number; language: Language }) => (
  <HStack spacing={{ base: 2, md: 4 }} justify="center" w="100%" mb={{ base: 4, md: 8 }}>
    {[1, 2, 3].map((step) => (
      <VStack key={step} spacing={1}>
        <Circle
          size={{ base: '30px', md: '40px' }}
          bg={step <= currentStep ? 'blue.600' : 'gray.300'}
          color="white"
          fontWeight="bold"
          transition="all 0.2s"
        >
          {step}
        </Circle>
        <Text
          color={step <= currentStep ? 'blue.700' : 'gray.600'}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={step === currentStep ? 'bold' : 'normal'}
          textAlign="center"
          display={{ base: 'none', md: 'block' }}
        >
          {step === 1
            ? texts.admission.form.parentInfo[language]
            : step === 2
              ? texts.admission.form.child[language]
              : texts.admission.form.message[language]}
        </Text>
      </VStack>
    ))}
  </HStack>
);

export const AdmissionRequest = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<z.infer<typeof admissionSchema>>>({});
  const toast = useToast();

  const phoneRegex = /^\+\d{1,3}\s?\d{3}[\s-]?\d{3}[\\s-]?\d{3}$/;

  const stepSchemas = {
    1: z.object({
      parentFirstName: z.string().min(1, texts.profile.validation.firstNameRequired[language]),
      parentSurname: z.string().min(1, texts.profile.validation.lastNameRequired[language]),
      parentEmail: z.string().email(texts.profile.validation.emailInvalid[language]),
      parentPhone: z
        .string()
        .optional()
        .refine((val) => !val || phoneRegex.test(val), {
          message: texts.profile.validation.invalidPhone[language],
        }),
    }),
    2: z.object({
      childFirstName: z.string().min(1, texts.profile.validation.firstNameRequired[language]),
      childSurname: z.string().min(1, texts.profile.validation.lastNameRequired[language]),
      dateOfBirth: z.string().min(1, texts.admission.form.dateOfBirth[language]),
    }),
    3: z.object({
      message: z.string().optional(),
    }),
  };

  const admissionSchema = z.object({
    ...stepSchemas[1].shape,
    ...stepSchemas[2].shape,
    ...stepSchemas[3].shape,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    getValues,
  } = useForm<z.infer<typeof admissionSchema>>({
    resolver: zodResolver(admissionSchema),
    mode: 'onChange',
    defaultValues: formData,
  });

  const handleNext = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const fieldsToValidate = Object.keys(
      stepSchemas[currentStep as keyof typeof stepSchemas].shape
    ) as Array<keyof z.infer<typeof admissionSchema>>;

    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid) {
      const currentValues = getValues();
      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(fieldsToValidate.map((field) => [field, currentValues[field]])),
      }));

      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } else {
      toast({
        title: texts.common.error[language],
        description: texts.admission.error.description[language],
        status: 'error',
      });
    }
  };

  const handleBack = () => {
    const currentValues = getValues();
    setFormData((prev) => ({
      ...prev,
      ...currentValues,
    }));

    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: z.infer<typeof admissionSchema>) => {
    if (currentStep !== 3) {
      handleNext();
      return;
    }

    try {
      const admissionRequest = {
        firstname: data.parentFirstName,
        surname: data.parentSurname,
        email: data.parentEmail,
        phone: data.parentPhone || null,
        child_firstname: data.childFirstName,
        child_surname: data.childSurname,
        date_of_birth: data.dateOfBirth,
        message: data.message || null,
      };

      await admissionService.requestAdmission(admissionRequest);

      toast({
        title: texts.admission.success.title[language],
        description: texts.admission.success.description[language],
        status: 'success',
        duration: 5000,
      });

      navigate('/');
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
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SectionCard title={texts.admission.form.parentInfo[language]}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl isInvalid={!!errors.parentFirstName}>
                <FormLabel>
                  <RequiredLabel>{texts.admission.form.parentFirstName[language]}</RequiredLabel>
                </FormLabel>
                <Input {...register('parentFirstName')} size="sm" />
                <FormErrorMessage>{errors.parentFirstName?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.parentSurname}>
                <FormLabel>
                  <RequiredLabel>{texts.admission.form.parentSurname[language]}</RequiredLabel>
                </FormLabel>
                <Input {...register('parentSurname')} size="sm" />
                <FormErrorMessage>{errors.parentSurname?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.parentEmail}>
                <FormLabel>
                  <RequiredLabel>{texts.admission.form.parentEmail[language]}</RequiredLabel>
                </FormLabel>
                <Input {...register('parentEmail')} size="sm" />
                <FormErrorMessage>{errors.parentEmail?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.parentPhone}>
                <FormLabel>{texts.admission.form.parentPhone[language]}</FormLabel>
                <Input {...register('parentPhone')} size="sm" />
                <FormErrorMessage>{errors.parentPhone?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
          </SectionCard>
        );
      case 2:
        return (
          <SectionCard title={texts.admission.form.child[language]}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl isInvalid={!!errors.childFirstName}>
                <FormLabel>
                  <RequiredLabel>{texts.admission.form.childFirstName[language]}</RequiredLabel>
                </FormLabel>
                <Input {...register('childFirstName')} size="sm" />
                <FormErrorMessage>{errors.childFirstName?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.childSurname}>
                <FormLabel>
                  <RequiredLabel>{texts.admission.form.childSurname[language]}</RequiredLabel>
                </FormLabel>
                <Input {...register('childSurname')} size="sm" />
                <FormErrorMessage>{errors.childSurname?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.dateOfBirth}>
                <FormLabel>
                  <RequiredLabel>{texts.admission.form.dateOfBirth[language]}</RequiredLabel>
                </FormLabel>
                <Input type="date" {...register('dateOfBirth')} size="sm" />
                <FormErrorMessage>{errors.dateOfBirth?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>
          </SectionCard>
        );
      case 3:
        return (
          <SectionCard title={texts.admission.form.message[language]}>
            <FormControl isInvalid={!!errors.message}>
              <Textarea
                {...register('message')}
                size="lg"
                rows={4}
                placeholder={texts.admission.form.message[language]}
              />
              <FormErrorMessage>{errors.message?.message}</FormErrorMessage>
            </FormControl>
          </SectionCard>
        );
      default:
        return null;
    }
  };

  return (
    <Container
      maxW={{ base: '100%', md: 'container.md' }}
      pt={{ base: 2, md: 4 }}
      pb={{ base: 16, md: 12 }}
    >
      <Card
        variant="outline"
        shadow="xl"
        bg="white"
        borderRadius={{ base: 'md', md: 'xl' }}
        overflow="hidden"
        position="relative"
        mb={{ base: 8, md: 12 }}
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h={{ base: '4px', md: '8px' }}
          bgImage="var(--chakra-gradients-decorative)"
        />
        <CardHeader pb={0} pt={{ base: 4, md: 4 }}>
          <VStack spacing={{ base: 2, md: 4 }} align="center">
            <GradientHeading>{texts.admission.title[language]}</GradientHeading>
            <Text
              color="gray.600"
              textAlign="center"
              fontSize={'md'}
              maxW="600px"
              bgGradient="linear(to-r, gray.600, gray.500)"
              bgClip="text"
              px={2}
            >
              {texts.admissionWelcome.description[language]}
            </Text>
          </VStack>
        </CardHeader>
        <CardBody>
          <Box
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' && currentStep !== 3) {
                e.preventDefault();
                handleNext();
              }
            }}
          >
            <VStack spacing={{ base: 4, md: 6 }}>
              <StepIndicator currentStep={currentStep} language={language} />
              {renderStep()}
              <HStack w="100%" spacing={{ base: 2, md: 4 }} justify="center">
                {currentStep > 1 && (
                  <Button
                    onClick={handleBack}
                    size={{ base: 'md', md: 'lg' }}
                    variant="outline"
                    w={{ base: '140px', md: '200px' }}
                    colorScheme="blue"
                  >
                    {texts.common.back[language]}
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button
                    onClick={(e) => handleNext(e)}
                    size={{ base: 'md', md: 'lg' }}
                    w={{ base: '140px', md: '200px' }}
                    bgImage="var(--chakra-gradients-primary)"
                    color="white"
                    _hover={{
                      bgImage: 'var(--chakra-gradients-primary)',
                      transform: 'translateY(-2px)',
                    }}
                    _active={{
                      bgImage: 'var(--chakra-gradients-primary)',
                    }}
                  >
                    {texts.common.next[language]}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size={{ base: 'md', md: 'lg' }}
                    w={{ base: '140px', md: '200px' }}
                    isLoading={isSubmitting}
                    bgImage="var(--chakra-gradients-primary)"
                    color="white"
                    _hover={{
                      bgImage: 'var(--chakra-gradients-primary)',
                      transform: 'translateY(-2px)',
                    }}
                    _active={{
                      bgImage: 'var(--chakra-gradients-primary)',
                    }}
                  >
                    {texts.admission.form.submit[language]}
                  </Button>
                )}
              </HStack>
            </VStack>
          </Box>
        </CardBody>
      </Card>
    </Container>
  );
};
