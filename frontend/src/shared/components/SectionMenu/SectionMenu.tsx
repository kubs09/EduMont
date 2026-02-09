import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  IconButton,
  Collapse,
  VStack,
  useBreakpointValue,
  useColorModeValue,
  type CardProps,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

export interface SectionMenuItem {
  key: string;
  label: string;
  isVisible?: boolean;
}

export interface SectionMenuProps {
  title: string;
  sections: SectionMenuItem[];
  activeKey: string;
  onChange: (key: string) => void;
  cardProps?: CardProps;
}

const SectionMenu = ({ title, sections, activeKey, onChange, cardProps }: SectionMenuProps) => {
  const menuBg = useColorModeValue('bg-surface', 'bg-surface');
  const menuActiveBg = useColorModeValue('gray.100', 'whiteAlpha.200');
  const menuActiveColor = useColorModeValue('gray.900', 'white');
  const menuTextColor = useColorModeValue('gray.700', 'whiteAlpha.800');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const visibleSections = sections.filter((section) => section.isVisible !== false);

  useEffect(() => {
    if (isMobile === undefined) return;
    setIsMenuOpen(!isMobile);
  }, [isMobile]);

  return (
    <Card
      w={{ base: 'full', md: '240px' }}
      bg={menuBg}
      position={{ base: 'static', md: 'sticky' }}
      top={{ md: 6 }}
      {...cardProps}
    >
      <CardBody p={{ base: 2, md: 4 }}>
        <HStack justify="space-between" mb={{ base: 2, md: 4 }}>
          <Heading size={{ base: 'sm', md: 'md' }}>{title}</Heading>
          {isMobile && (
            <IconButton
              aria-label={title}
              icon={isMenuOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen((open) => !open)}
            />
          )}
        </HStack>
        <Collapse in={!isMobile || isMenuOpen} animateOpacity>
          <VStack spacing={{ base: 1, md: 2 }} align="stretch">
            {visibleSections.map((section) => {
              const isActive = section.key === activeKey;
              return (
                <Button
                  key={section.key}
                  variant="ghost"
                  justifyContent="flex-start"
                  size={{ base: 'sm', md: 'md' }}
                  onClick={() => onChange(section.key)}
                  bg={isActive ? menuActiveBg : 'transparent'}
                  color={isActive ? menuActiveColor : menuTextColor}
                  fontWeight={isActive ? 'semibold' : 'normal'}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {section.label}
                </Button>
              );
            })}
          </VStack>
        </Collapse>
      </CardBody>
    </Card>
  );
};

export default SectionMenu;
