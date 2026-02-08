import { Button } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { Section } from '@frontend/shared/components';

interface ClassSectionProps {
  onOpenClasses: () => void;
}

const ClassSection = ({ onOpenClasses }: ClassSectionProps) => {
  const { language } = useLanguage();

  return (
    <Section title={texts.classes.teacherClassMenuItem[language]} cardProps={{ mb: 6 }}>
      <Button variant="brand" onClick={onOpenClasses}>
        {texts.classes.menuItem[language]}
      </Button>
    </Section>
  );
};

export default ClassSection;
