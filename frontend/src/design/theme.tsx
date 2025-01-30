import { extendTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    primary: {
      900: '#1A365D', // matches Chakra's blue.900
      800: '#2A4365', // matches Chakra's blue.800
      700: '#2C5282', // matches Chakra's blue.700
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
            bg: 'black',
          },
        },
      },
    },
  },
});

export default theme;
