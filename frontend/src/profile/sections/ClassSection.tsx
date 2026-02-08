import { useEffect, useState } from 'react';
import { Box, Button, Stack, Text, VStack } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Section } from '@frontend/shared/components';
import { getClasses } from '@frontend/services/api/class';
import { Class } from '@frontend/types/class';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@frontend/shared/route';

interface ClassSectionProps {
  onOpenClasses: () => void;
  subtleBg?: string;
}

const ClassSection = ({ onOpenClasses, subtleBg }: ClassSectionProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await getClasses();
        setClasses(response || []);
      } catch (error) {
        setClasses([]);
      }
    };

    fetchClasses();
  }, []);

  return (
    <Section title={texts.classes.teacherClassMenuItem[language]} cardProps={{ mb: 6 }}>
      <Stack spacing={4}>
        {classes.length > 0 ? (
          <VStack align="start" spacing={2} w="full">
            {classes.map((classItem) => (
              <Box bg={subtleBg} p={2} borderRadius="md" w="full" key={classItem.id}>
                <Button
                  key={classItem.id}
                  variant="ghost"
                  onClick={() => navigate(`${ROUTES.CLASSES}/${classItem.id}`)}
                >
                  {classItem.name}
                </Button>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text color="gray.500">{texts.classes.noClasses[language]}</Text>
        )}
      </Stack>
    </Section>
  );
};

export default ClassSection;
