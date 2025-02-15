import { Box, Button, Container, Heading, Text, SimpleGrid, VStack } from '@chakra-ui/react';
import { FaGraduationCap, FaChalkboardTeacher, FaUserFriends } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/route';
import { useLanguage } from '../shared/contexts/LanguageContext';
import { texts } from '../texts';

const FeatureIcon = ({ icon: Icon }: { icon: IconType }) => (
  <Box
    p={5}
    borderRadius="full"
    bg="bg.decorative"
    boxShadow="lg"
    border="2px solid"
    borderColor="purple.100"
    transition="all 0.2s"
    _hover={{
      transform: 'scale(1.1) rotate(5deg)',
      borderColor: 'purple.200',
      boxShadow: 'xl',
    }}
  >
    <Icon
      size="40px"
      style={{
        filter: 'url(#gradient-filter)',
      }}
    />
  </Box>
);

const HomePage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <Box pb={{ base: 16, md: 20 }}>
      <Box position="relative" bg="bg.app" py={{ base: 12, md: 14 }} overflow="hidden">
        <Box position="absolute" top={0} left={0} right={0} h="8px" bg="gradient.decorative" />
        <Container maxW="container.xl" textAlign="center">
          <Heading
            size="2xl"
            mb={6}
            bg="gradient.title"
            bgClip="text"
            letterSpacing="tight"
            fontWeight="bold"
          >
            {texts.home.hero.title[language]}
          </Heading>
          <Text fontSize="xl" mb={8} color="gradient.decorative" fontWeight="medium">
            {texts.home.hero.subtitle[language]}
          </Text>
        </Container>
      </Box>

      {/* Features Section with CTA Button */}
      <Box bg="bg.app">
        <Container maxW="container.xl">
          {/* CTA Button */}
          <Box textAlign="center" mb={16}>
            <Button
              size="lg"
              bg="gradient.primary"
              color="white"
              onClick={() => navigate(ROUTES.ADMISSION_REQUEST)}
              px={12}
              py={7}
              fontSize="lg"
              _hover={{
                bg: 'gradient.primary',
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              _active={{
                bg: 'gradient.primary',
              }}
              transition="all 0.2s"
            >
              {texts.home.cta.requestAdmission[language]}
            </Button>
          </Box>

          {/* Features Grid */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <FeatureCard
              icon={FaGraduationCap}
              title={texts.home.features.qualityEducation.title[language]}
              text={texts.home.features.qualityEducation.description[language]}
            />
            <FeatureCard
              icon={FaChalkboardTeacher}
              title={texts.home.features.expertTeachers.title[language]}
              text={texts.home.features.expertTeachers.description[language]}
            />
            <FeatureCard
              icon={FaUserFriends}
              title={texts.home.features.interactiveLearning.title[language]}
              text={texts.home.features.interactiveLearning.description[language]}
            />
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
};

const FeatureCard = ({ icon, title, text }: { icon: IconType; title: string; text: string }) => {
  return (
    <VStack
      p={8}
      bg="bg.app"
      borderRadius="lg"
      boxShadow="lg"
      align="center"
      spacing={6}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
      position="relative"
      overflow="hidden"
    >
      <Box position="absolute" top={0} left={0} right={0} h="4px" bg="gradient.primary" />
      <FeatureIcon icon={icon} />
      <Heading size="md" bg="gradient.title" bgClip="text" fontWeight="bold">
        {title}
      </Heading>
      <Text textAlign="center" color="gradient.decorative" fontSize="md">
        {text}
      </Text>
    </VStack>
  );
};

export default HomePage;
