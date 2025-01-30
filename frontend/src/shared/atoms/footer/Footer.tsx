import { Flex, Text } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Flex
      as="footer"
      bg="brand.primary.900"
      color="white"
      p={4}
      justifyContent="center"
      alignItems="center"
      position="fixed"
      bottom={0}
      width="100%"
    >
      <Text fontSize="sm">©2025, Šimon Kubín, Vysoká Škola Ekonomická</Text>
    </Flex>
  );
};

export default Footer;
