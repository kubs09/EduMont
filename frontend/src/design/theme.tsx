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
};

const theme = extendTheme({
  colors,
  components: {
    Header: {
      baseStyle: {
        bg: 'brand.primary.900',
        color: 'white',
      },
    },
    Button: {
      variants: {
        brand: {
          bg: 'brand.primary.900',
          color: 'white',
          _hover: {
            bg: 'brand.primary.800',
          },
        },
        secondary: {
          bg: 'brand.secondary.900',
          color: 'white',
          _hover: {
            bg: 'brand.secondary.800',
          },
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: '#FAF9F6', // Soft off-white background
      },
    },
  },
});

export default theme;
