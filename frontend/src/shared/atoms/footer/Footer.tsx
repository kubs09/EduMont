import { Box, Flex, Hide, Show, Text, useColorModeValue } from '@chakra-ui/react';
import ColorModeToggle from '../color-mode-toggle';

const Footer = () => {
  const footerBg = useColorModeValue('brand.primary.900', 'brand.dark.surface');
  const footerColor = useColorModeValue('white', 'brand.dark.text.primary');

  return (
    <Flex
      as="footer"
      bg={footerBg}
      color={footerColor}
      p={2}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      position="fixed"
      bottom={0}
      width="100%"
      borderTop="1px"
      borderColor="border-color"
    >
      <Box>
        <Show above="md">
          <ColorModeToggle size="md" />
        </Show>
        <Hide above="md">
          <ColorModeToggle size="sm" />
        </Hide>
      </Box>
      <Text fontSize="sm">©2025, Šimon Kubín, Vysoká Škola Ekonomická</Text>
    </Flex>
  );
};

export default Footer;
