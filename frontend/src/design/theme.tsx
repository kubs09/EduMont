import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const colors = {
  brand: {
    primary: {
      900: '#557A95', // Calm blue
      800: '#7A8B99',
      700: '#89A1B5',
      600: '#9BB4C8',
      500: '#B4C7D9',
      400: '#CCDAEA',
      300: '#E5EDFB',
    },
    secondary: {
      900: '#BE8A60', // Warm earth tone
      800: '#C99B76',
      700: '#D4AC8B',
      600: '#DFBDA1',
      500: '#EACEB6',
      400: '#F5DFCB',
      300: '#FAF0E0',
    },
    accent: {
      900: '#8E9B6C', // Sage green
      800: '#A1AC82',
      700: '#B4BD98',
      600: '#C7CEAE',
      500: '#DADFC4',
      400: '#EDF0DA',
      300: '#F6F8F0',
    },
    dark: {
      bg: '#1A202C',
      surface: '#2D3748',
      border: '#4A5568',
      text: {
        primary: '#F7FAFC',
        secondary: '#E2E8F0',
        muted: '#A0AEC0',
      },
    },
    light: {
      bg: '#FAF9F6',
      surface: '#FFFFFF',
      border: '#E2E8F0',
      text: {
        primary: '#2D3748',
        secondary: '#4A5568',
        muted: '#718096',
      },
    },
  },
  red: {
    50: '#FDF5F4',
    100: '#F9E6E4',
    200: '#F3D1CE',
    300: '#E9B5B0',
    400: '#DE9791',
    500: '#D27974',
    600: '#C4625C',
    700: '#B04F49',
    800: '#94413D',
    900: '#7A3431',
  },
};

const theme = extendTheme({
  config,
  colors,
  semanticTokens: {
    colors: {
      'bg-canvas': {
        default: 'brand.light.bg',
        _dark: 'brand.dark.bg',
      },
      'bg-surface': {
        default: 'brand.light.surface',
        _dark: 'brand.dark.surface',
      },
      'border-color': {
        default: 'brand.light.border',
        _dark: 'brand.dark.border',
      },
      'text-primary': {
        default: 'brand.light.text.primary',
        _dark: 'brand.dark.text.primary',
      },
      'text-secondary': {
        default: 'brand.light.text.secondary',
        _dark: 'brand.dark.text.secondary',
      },
      'text-muted': {
        default: 'brand.light.text.muted',
        _dark: 'brand.dark.text.muted',
      },
    },
  },
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
          _dark: {
            bg: 'brand.primary.700',
            _hover: {
              bg: 'brand.primary.600',
            },
          },
        },
        delete: {
          bg: 'red.500',
          color: 'white',
          _hover: {
            bg: 'red.600',
          },
          _active: {
            bg: 'red.700',
          },
          _dark: {
            bg: 'red.900',
            color: 'white',
            _hover: {
              bg: 'red.800',
            },
            _active: {
              bg: 'red.600',
            },
          },
        },
        secondary: {
          bg: 'brand.secondary.900',
          color: 'white',
          _hover: {
            bg: 'brand.secondary.800',
          },
          _dark: {
            bg: 'brand.secondary.700',
            _hover: {
              bg: 'brand.secondary.600',
            },
          },
        },
        ghost: {
          color: 'text-primary',
          _hover: {
            bg: 'bg-surface',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'bg-surface',
          borderColor: 'border-color',
          color: 'text-primary',
        },
      },
    },
    Table: {
      variants: {
        simple: {
          tbody: {
            tr: {
              _hover: {
                bg: 'gray.200',
                _dark: {
                  bg: 'whiteAlpha.50',
                },
              },
            },
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'bg-surface',
            borderColor: 'border-color',
            color: 'text-primary',
            _placeholder: {
              color: 'text-muted',
            },
            _focus: {
              borderColor: 'brand.primary.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary-500)',
            },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          bg: 'bg-surface',
          borderColor: 'border-color',
          color: 'text-primary',
          _placeholder: {
            color: 'text-muted',
          },
          _focus: {
            borderColor: 'brand.primary.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary-500)',
          },
        },
      },
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'bg-surface',
            borderColor: 'border-color',
            color: 'text-primary',
            _focus: {
              borderColor: 'brand.primary.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary-500)',
            },
          },
        },
      },
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: 'bg-canvas',
        color: 'text-primary',
        transition: 'background-color 0.2s, color 0.2s',
      },
      '*': {
        borderColor: 'border-color',
      },
    }),
  },
});

export default theme;
