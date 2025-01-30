import { Button, Flex, Heading, ButtonGroup, Image } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { texts } from '../../../texts';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ROUTES } from '../../route';
import icon from './icon.png';

const Header = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = ROUTES.LOGIN;
  };

  const handleLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <Flex
      as="header"
      p={4}
      bg="brand.primary.900"
      color="white"
      borderBottomWidth={1}
      justify="space-between"
      align="center"
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Flex align="center" gap={4}>
        <Image src={icon} alt="EduMont logo" height="50px" />
        <Heading size="xl">EduMont</Heading>
      </Flex>
      <Flex gap={4}>
        <ButtonGroup>
          <Button
            colorScheme="whiteAlpha"
            variant={language === 'cs' ? 'solid' : 'outline'}
            onClick={() => setLanguage('cs')}
          >
            CZ
          </Button>
          <Button
            colorScheme="whiteAlpha"
            variant={language === 'en' ? 'solid' : 'outline'}
            onClick={() => setLanguage('en')}
          >
            EN
          </Button>
        </ButtonGroup>
        {isAuthenticated ? (
          <Button colorScheme="whiteAlpha" onClick={handleLogout}>
            {texts.auth.logout[language]}
          </Button>
        ) : (
          <Button colorScheme="whiteAlpha" onClick={handleLogin}>
            {texts.auth.login[language]}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default Header;
