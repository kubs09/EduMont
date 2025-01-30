import { extendTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    primary: {
      900: '#1a365d', // dark blue
      800: '#2a4365',
      700: '#2c5282',
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
  },
});

export default theme;
