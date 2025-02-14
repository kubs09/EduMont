import { Box, Flex, Text } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box
      as="footer"
      position="fixed"
      bottom={0}
      width="100%"
      bgGradient="linear(to-r, blue.500, purple.600)"
      boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
      zIndex={1000}
    >
      <Flex justifyContent="center" alignItems="center" p={4}>
        <Text fontSize="sm" color="white" fontWeight="medium">
          ©2025, Šimon Kubín, Vysoká Škola Ekonomická
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
