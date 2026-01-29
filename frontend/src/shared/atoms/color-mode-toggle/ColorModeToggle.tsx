import React from 'react';
import { IconButton, useColorMode, useColorModeValue, Tooltip } from '@chakra-ui/react';
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
    <Tooltip label={label} placement="bottom">
      <IconButton
        aria-label={label}
        icon={<Icon />}
        onClick={toggleColorMode}
        size={size}
        variant={variant}
        color="text-primary"
        _hover={{
          bg: 'bg-surface',
          transform: 'scale(1.05)',
        }}
        transition="all 0.2s"
      />
    </Tooltip>
  );
};

export default ColorModeToggle;
