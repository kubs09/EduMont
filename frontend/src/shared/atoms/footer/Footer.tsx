import { Box, Flex, Hide, Show, Text } from '@chakra-ui/react';
import ColorModeToggle from '../color-mode-toggle';
import { useAtomColors } from '@frontend/design/colorModeUtils';

const Footer = () => {
  const { bg: footerBg, color: footerColor } = useAtomColors();

  return (
    <Flex
      as="footer"
      bg={footerBg}
      color={footerColor}
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
