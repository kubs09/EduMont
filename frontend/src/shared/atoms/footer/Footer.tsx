import { Flex, Text, useColorModeValue } from '@chakra-ui/react';

const Footer = () => {
  const footerBg = useColorModeValue('brand.primary.900', 'brand.dark.surface');
  const footerColor = useColorModeValue('white', 'brand.dark.text.primary');

  return (
    <Flex
      as="footer"
      bg={footerBg}
      color={footerColor}
      p={4}
      justifyContent="center"
      alignItems="center"
      position="fixed"
      bottom={0}
      width="100%"
      borderTop="1px"
      borderColor="border-color"
    >
      <Text fontSize="sm">©2025, Šimon Kubín, Vysoká Škola Ekonomická</Text>
    </Flex>
  );
};

export default Footer;
