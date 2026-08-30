import { createSystem, defaultConfig, defineRecipe, defineSlotRecipe } from '@chakra-ui/react';

const colors = {
  brand: {
    primary: {
      900: {
        value: '#2c83c1',
      }, // Calm blue
      800: {
        value: '#7A8B99',
      },
      700: {
        value: '#0e3471',
      },
      600: {
        value: '#020b71',
      },
      500: {
        value: '#B4C7D9',
      },
      400: {
        value: '#CCDAEA',
      },
      300: {
        value: '#E5EDFB',
      },
    },
    secondary: {
      900: {
        value: '#a3b8f1',
      }, // Warm earth tone
      800: {
        value: '#accbeb',
      },
      700: {
        value: '#5f8595',
      },
      600: {
        value: '#3e6786',
      },
      500: {
        value: '#EACEB6',
      },
      400: {
        value: '#F5DFCB',
      },
      300: {
        value: '#FAF0E0',
      },
    },
    accent: {
      900: {
        value: '#8E9B6C',
      }, // Sage green
      800: {
        value: '#A1AC82',
      },
      700: {
        value: '#B4BD98',
      },
      600: {
        value: '#C7CEAE',
      },
      500: {
        value: '#DADFC4',
      },
      400: {
        value: '#EDF0DA',
      },
      300: {
        value: '#F6F8F0',
      },
    },
    dark: {
      bg: { value: '#1A202C' },
      surface: { value: '#365282' },
      border: { value: '#4A5568' },
      atom: { value: '#01253e' },
      text: {
        primary: {
          value: '#F7FAFC',
        },
        secondary: {
          value: '#E2E8F0',
        },
        muted: {
          value: '#A0AEC0',
        },
      },
    },
    light: {
      bg: { value: '#e1e3e5' },
      surface: { value: '#c3cfe9' },
      border: { value: '#E2E8F0' },
      atom: { value: '#538eb9' },
      text: {
        primary: {
          value: '#2D3748',
        },
        secondary: {
          value: '#4A5568',
        },
        muted: {
          value: '#718096',
        },
      },
    },
  },
  red: {
    50: {
      value: '#FDF5F4',
    },
    100: {
      value: '#F9E6E4',
    },
    200: {
      value: '#F3D1CE',
    },
    300: {
      value: '#E9B5B0',
    },
    400: {
      value: '#DE9791',
    },
    500: {
      value: '#D27974',
    },
    600: {
      value: '#C4625C',
    },
    700: {
      value: '#B04F49',
    },
    800: {
      value: '#94413D',
    },
    900: {
      value: '#7A3431',
    },
  },
};

const headerRecipe = defineRecipe({
  base: {
    bg: 'brand.primary.900',
    color: 'white',
  },
});

const buttonRecipe = defineRecipe({
  variants: {
    variant: {
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
});

const textRecipe = defineRecipe({
  variants: {
    variant: {
      heading: {
        fontSize: { base: '2xl', md: '3xl' },
        fontWeight: 'bold',
        color: 'text-primary',
      },
      empty: {
        fontSize: 'md',
        color: 'text-muted',
      },
      link: {
        color: 'fg-brand',
        _hover: {
          textDecoration: 'underline',
        },
      },
      filter: {
        fontSize: 'sm',
        color: 'text-secondary',
      },
    },
  },
});

const cardSlotRecipe = defineSlotRecipe({
  slots: ['root'],
  base: {
    root: {
      bg: 'bg-surface',
      borderColor: 'border-color',
      color: 'text-primary',
    },
  },
});

const tableSlotRecipe = defineSlotRecipe({
  slots: ['row'],
  variants: {
    variant: {
      simple: {
        row: {
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
});

const inputRecipe = defineRecipe({
  variants: {
    variant: {
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
});

const textareaRecipe = defineRecipe({
  variants: {
    variant: {
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
});

const nativeSelectSlotRecipe = defineSlotRecipe({
  slots: ['field'],
  variants: {
    variant: {
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
});

const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      bg: 'bg-canvas',
      color: 'text-primary',
      transition: 'background-color 0.2s, color 0.2s',
    },
    '*': {
      borderColor: 'border-color',
    },
  },

  theme: {
    tokens: {
      colors,
    },

    semanticTokens: {
      colors: {
        'bg-canvas': {
          value: {
            base: '{colors.brand.light.bg}',
            _dark: '{colors.brand.dark.bg}',
          },
        },
        'bg-surface': {
          value: {
            base: '{colors.brand.light.surface}',
            _dark: '{colors.brand.dark.surface}',
          },
        },
        'border-color': {
          value: {
            base: '{colors.brand.light.border}',
            _dark: '{colors.brand.dark.border}',
          },
        },
        'text-primary': {
          value: {
            base: '{colors.brand.light.text.primary}',
            _dark: '{colors.brand.dark.text.primary}',
          },
        },
        'text-secondary': {
          value: {
            base: '{colors.brand.light.text.secondary}',
            _dark: '{colors.brand.dark.text.secondary}',
          },
        },
        'text-muted': {
          value: {
            base: '{colors.brand.light.text.muted}',
            _dark: '{colors.brand.dark.text.muted}',
          },
        },
        'text-danger': {
          value: {
            base: '{colors.red.500}',
            _dark: '{colors.red.300}',
          },
        },
        'fg-brand': {
          value: {
            base: '{colors.brand.primary.900}',
            _dark: '{colors.brand.primary.400}',
          },
        },
        'bg-brand-subtle': {
          value: {
            base: '{colors.brand.primary.300}',
            _dark: '{colors.brand.primary.700}',
          },
        },
        'bg-brand-solid': {
          value: {
            base: '{colors.brand.primary.900}',
            _dark: '{colors.brand.primary.700}',
          },
        },
      },
    },

    recipes: {
      header: headerRecipe,
      button: buttonRecipe,
      text: textRecipe,
      input: inputRecipe,
      textarea: textareaRecipe,
    },

    slotRecipes: {
      card: cardSlotRecipe,
      table: tableSlotRecipe,
      nativeSelect: nativeSelectSlotRecipe,
    },
  },
});

export default system;
