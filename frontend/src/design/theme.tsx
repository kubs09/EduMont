import { extendTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    primary: {
      900: '#557A95', // Calm blue
      800: '#7A8B99',
      700: '#89A1B5',
    },
    secondary: {
      900: '#BE8A60', // Warm earth tone
      800: '#C99B76',
      700: '#D4AC8B',
    },
    accent: {
      900: '#8E9B6C', // Sage green
      800: '#A1AC82',
      700: '#B4BD98',
    },
  },
  navy: {
    900: '#1B2B4B',
    800: '#243660',
    700: '#2C4175',
    600: '#354C8A',
    500: '#3E57A0',
  },
  background: {
    light: '#FFFFFF',
    dark: '#1A1F2C', // Deep navy blue-gray
  },
  elements: {
    light: {
      bg: '#FFFFFF',
      border: '#E2E8F0',
      hover: '#F7FAFC',
    },
    dark: {
      bg: '#1B2B4B',
      border: '#2D3748',
      hover: '#243660',
    },
  },
};

const gradients = {
  light: {
    header: 'linear-gradient(to right, #557A95, #BE8A60)',
    title: 'linear-gradient(to right, #4299E1, #805AD5)',
    primary: 'linear-gradient(to right, #3182CE, #805AD5)',
    decorative: 'linear-gradient(to right, #4299E1, #805AD5, #D53F8C)',
  },
  dark: {
    header: 'linear-gradient(to right, #2D3748, #6B46C1)',
    title: 'linear-gradient(to right, #63B3ED, #9F7AEA)',
    primary: 'linear-gradient(to right, #63B3ED, #9F7AEA)',
    decorative: 'linear-gradient(to right, #63B3ED, #9F7AEA, #ED64A6)',
  },
};

const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  colors,
  semanticTokens: {
    colors: {
      'gradient.header': {
        default: gradients.light.header,
        _dark: gradients.dark.header,
      },
      'gradient.title': {
        default: gradients.light.title,
        _dark: gradients.dark.title,
      },
      'gradient.primary': {
        default: gradients.light.primary,
        _dark: gradients.dark.primary,
      },
      'gradient.decorative': {
        default: gradients.light.decorative,
        _dark: gradients.dark.decorative,
      },
      'bg.app': {
        default: colors.background.light,
        _dark: colors.background.dark,
      },
      'element.bg': {
        default: colors.elements.light.bg,
        _dark: colors.elements.dark.bg,
      },
      'element.border': {
        default: colors.elements.light.border,
        _dark: colors.elements.dark.border,
      },
      'element.hover': {
        default: colors.elements.light.hover,
        _dark: colors.elements.dark.hover,
      },
    },
  },
  styles: {
    global: (props: { colorMode: 'light' | 'dark' }) => ({
      body: {
        bg: 'bg.app',
        color: props.colorMode === 'light' ? 'gray.800' : 'whiteAlpha.900',
        minHeight: '100vh',
        backgroundImage:
          props.colorMode === 'light'
            ? 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(103, 178, 255, 0.05))'
            : 'linear-gradient(to bottom right, rgba(0, 0, 0, 0.2), rgba(66, 153, 225, 0.05))',
      },
    }),
  },
});

export default theme;
