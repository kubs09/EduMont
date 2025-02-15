import { Box, Text, VStack, IconButton, useColorMode } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

const Footer = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      as="footer"
      bottom={0}
      width="100%"
      bg="gradient.header"
      boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
      zIndex={1000}
    >
      <VStack py={2}>
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          variant="ghost"
          color="white"
          size="sm"
          _hover={{ bg: 'whiteAlpha.200' }}
        />
        <Text fontSize="sm" color="white" fontWeight="medium">
          ©2025, Šimon Kubín, Vysoká Škola Ekonomická
        </Text>
      </VStack>
    </Box>
  );
};

export default Footer;
