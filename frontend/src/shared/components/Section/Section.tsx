import { ReactNode } from 'react';
import { Card, Heading } from '@chakra-ui/react';

interface SectionProps {
  title?: string;
  children: ReactNode;
  cardProps?: Card.RootProps;
}

const Section = ({ title, children, cardProps }: SectionProps) => {
  return (
    <Card.Root bg="bg-surface" borderColor="border-color" color="text-primary" {...cardProps}>
      {title && (
        <Card.Header>
          <Heading size="md">{title}</Heading>
        </Card.Header>
      )}
      <Card.Body w="full" maxW="100%" overflowX="auto">
        {children}
      </Card.Body>
    </Card.Root>
  );
};

export default Section;
