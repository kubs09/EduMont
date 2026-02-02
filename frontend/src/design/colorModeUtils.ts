import { useColorModeValue } from '@chakra-ui/react';

// Custom hook for commonly used color mode values
export const useAppColors = () => {
  return {
    // Background colors
    background: {
      canvas: useColorModeValue('brand.light.bg', 'brand.dark.bg'),
      surface: useColorModeValue('brand.light.surface', 'brand.dark.surface'),
      elevated: useColorModeValue('white', 'brand.dark.surface'),
    },

    // Text colors
    text: {
      primary: useColorModeValue('brand.light.text.primary', 'brand.dark.text.primary'),
      secondary: useColorModeValue('brand.light.text.secondary', 'brand.dark.text.secondary'),
      muted: useColorModeValue('brand.light.text.muted', 'brand.dark.text.muted'),
    },

    // Border colors
    border: {
      default: useColorModeValue('brand.light.border', 'brand.dark.border'),
      focus: useColorModeValue('brand.primary.500', 'brand.primary.400'),
    },

    // Brand colors for different modes
    brand: {
      primary: useColorModeValue('brand.primary.900', 'brand.primary.700'),
      primaryHover: useColorModeValue('brand.primary.800', 'brand.primary.600'),
      secondary: useColorModeValue('brand.secondary.900', 'brand.secondary.700'),
      secondaryHover: useColorModeValue('brand.secondary.800', 'brand.secondary.600'),
      accent: useColorModeValue('brand.accent.900', 'brand.accent.700'),
      accentHover: useColorModeValue('brand.accent.800', 'brand.accent.600'),
    },

    // Interactive elements
    interactive: {
      hover: useColorModeValue('gray.100', 'gray.700'),
      active: useColorModeValue('gray.200', 'gray.600'),
    },
  };
};

// Utility function to get shadow colors based on color mode
export const useAppShadows = () => {
  return {
    sm: useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.3)'),
    md: useColorModeValue('rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.4)'),
    lg: useColorModeValue('rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)'),
  };
};

// Header and Menu colors
export const useHeaderColors = () => {
  return {
    bg: useColorModeValue('brand.primary.900', 'brand.dark.surface'),
    color: useColorModeValue('white', 'brand.dark.text.primary'),
  };
};

export const useMenuColors = () => {
  return {
    bg: useColorModeValue('brand.primary.900', 'brand.dark.surface'),
    hoverBg: useColorModeValue('brand.primary.800', 'brand.dark.surface'),
    borderColor: useColorModeValue('whiteAlpha.300', 'brand.dark.border'),
  };
};

// HomePage colors
export const useHomePageColors = () => {
  return {
    bgColor: useColorModeValue('brand.light.bg', 'brand.dark.bg'),
    heroBg: useColorModeValue('brand.primary.900', 'brand.dark.surface'),
    heroColor: useColorModeValue('white', 'brand.dark.text.primary'),
    cardBg: useColorModeValue('brand.light.surface', 'brand.dark.surface'),
  };
};
