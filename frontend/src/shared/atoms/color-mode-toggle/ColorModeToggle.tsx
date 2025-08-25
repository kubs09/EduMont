import React from 'react';
import { IconButton, useColorMode, useColorModeValue, Tooltip } from '@chakra-ui/react';
import { FiSun, FiMoon } from 'react-icons/fi';

interface ColorModeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
}

const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ size = 'md', variant = 'ghost' }) => {
  const { toggleColorMode } = useColorMode();
  const Icon = useColorModeValue(FiMoon, FiSun);
  const label = useColorModeValue('Switch to dark mode', 'Switch to light mode');

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
