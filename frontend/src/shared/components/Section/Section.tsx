import { ReactNode } from 'react';
import { Card, CardBody, CardHeader, Heading, type CardProps } from '@chakra-ui/react';

interface SectionProps {
  title?: string;
  children: ReactNode;
  cardProps?: CardProps;
}

const Section = ({ title, children, cardProps }: SectionProps) => {
  return (
    <Card bg="bg-surface" borderColor="border-color" color="text-primary" {...cardProps}>
      {title && (
        <CardHeader>
          <Heading size="md">{title}</Heading>
        </CardHeader>
      )}
      <CardBody w="full" maxW="100%" overflowX="auto">
        {children}
      </CardBody>
    </Card>
  );
};

export default Section;
