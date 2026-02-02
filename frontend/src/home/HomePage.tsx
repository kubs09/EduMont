import { Box, Button, Container, Heading, Text, SimpleGrid, Icon, VStack } from '@chakra-ui/react';
import { FaGraduationCap, FaChalkboardTeacher, FaUserFriends } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/route';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { texts } from '@frontend/texts';
import { useHomePageColors } from '@frontend/design/colorModeUtils';

const HomePage = () => {
  const navigate = useNavigate();
  const { bgColor, heroBg, heroColor } = useHomePageColors();
  const { language } = useLanguage();

  return (
    <Box>
      {/* Hero Section */}
      <Box bg={heroBg} color={heroColor} py={20}>
        <Container maxW="container.xl" textAlign="center">
          <Heading size="2xl" mb={6}>
            {texts.home.hero.title[language]}
          </Heading>
          <Text fontSize="xl" mb={8}>
            {texts.home.hero.subtitle[language]}
          </Text>
          <Button
            size="lg"
            colorScheme="white"
            variant="outline"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            {texts.home.hero.getStarted[language]}
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Box bg={bgColor} py={20}>
        <Container maxW="container.xl">
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

      {/* CTA Section */}
      <Box py={20}>
        <Container maxW="container.xl" textAlign="center">
          <Heading size="xl" mb={6}>
            {texts.home.cta.title[language]}
          </Heading>
          <Text fontSize="lg" mb={8}>
            {texts.home.cta.subtitle[language]}
          </Text>
        </Container>
      </Box>
    </Box>
  );
};
const FeatureCard = ({ icon, title, text }: { icon: IconType; title: string; text: string }) => {
  const { cardBg } = useHomePageColors();

  return (
    <VStack p={8} bg={cardBg} borderRadius="lg" boxShadow="md" align="center" spacing={4}>
      <Icon as={icon} w={10} h={10} color="brand.primary.900" />
      <Heading size="md">{title}</Heading>
      <Text textAlign="center">{text}</Text>
    </VStack>
  );
};

export default HomePage;
