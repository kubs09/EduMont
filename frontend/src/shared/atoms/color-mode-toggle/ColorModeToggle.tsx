import React from 'react';
import { useColorMode, useColorModeValue } from "../../../components/ui/color-mode";
import { IconButton } from '@chakra-ui/react';
import { Tooltip } from '@frontend/components/ui/tooltip';
import { FiSun, FiMoon } from 'react-icons/fi';
import texts from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';

interface ColorModeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
}

const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ size = 'md', variant = 'ghost' }) => {
  const { toggleColorMode } = useColorMode();
  const { language } = useLanguage();
  const Icon = useColorModeValue(FiMoon, FiSun);
  const label = useColorModeValue(
    texts.common.colorModeToggle.dark[language],
    texts.common.colorModeToggle.light[language]
  );

  return (
    <Tooltip content={label} positioning={{
      placement: "bottom"
    }}>
      <IconButton
        aria-label={label}
        onClick={toggleColorMode}
        size={size}
        variant={variant}
        color="text-primary"
        _hover={{
          bg: 'bg-surface',
          transform: 'scale(1.05)',
        }}
        transition="all 0.2s">{React.createElement(Icon as React.ElementType)}</IconButton>
    </Tooltip>
  );
};

export default ColorModeToggle;
