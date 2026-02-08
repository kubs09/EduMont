import { Button } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Section } from '@frontend/shared/components';

interface ChildrenSectionProps {
  onOpenChildren: () => void;
}

const ChildrenSection = ({ onOpenChildren }: ChildrenSectionProps) => {
  const { language } = useLanguage();

  return (
    <Section title={texts.profile.children.titleParent[language]} cardProps={{ mb: 6 }}>
      <Button variant="brand" onClick={onOpenChildren}>
        {texts.profile.children.viewDashboard[language]}
      </Button>
    </Section>
  );
};

export default ChildrenSection;
