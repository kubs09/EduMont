import { useEffect, useState } from 'react';
import { Box, Button, HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Section } from '@frontend/shared/components';
import { getChildren } from '@frontend/services/api';
import { Child } from '@frontend/types/child';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@frontend/shared/route';

interface ChildrenSectionProps {
  onOpenChildren: () => void;
  subtleBg?: string;
}

const ChildrenSection = ({ onOpenChildren, subtleBg }: ChildrenSectionProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await getChildren();
        setChildren(response || []);
      } catch (error) {
        setChildren([]);
      }
    };

    fetchChildren();
  }, []);

  return (
    <Section title={texts.profile.children.titleParent[language]} cardProps={{ mb: 6 }}>
      <Stack spacing={4}>
        {children.length > 0 ? (
          <VStack align="start" spacing={2} w="full">
            {children.map((child) => (
              <Box bg={subtleBg} p={2} borderRadius="md" w="full" key={child.id}>
                <Button
                  key={child.id}
                  variant="ghost"
                  onClick={() => navigate(`${ROUTES.CHILDREN}/${child.id}`)}
                >
                  {`${child.firstname} ${child.surname}`}
                </Button>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text color="gray.500">{texts.profile.children.noChildren[language]}</Text>
        )}
        <HStack justify="flex-start">
          <Button variant="brand" onClick={onOpenChildren}>
            {texts.profile.children.viewDashboard[language]}
          </Button>
        </HStack>
      </Stack>
    </Section>
  );
};

export default ChildrenSection;
