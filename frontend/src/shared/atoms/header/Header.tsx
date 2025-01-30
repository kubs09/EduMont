import { Box, Button, Flex, Heading, ButtonGroup } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { texts } from '../../../texts';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ROUTES } from '../../route';

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
      bg="white"
      borderBottomWidth={1}
      justify="space-between"
      align="center"
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Heading size="2xl">EduMont</Heading>
      <Flex gap={4}>
        <ButtonGroup>
          <Button
            variant={language === 'cs' ? 'solid' : 'outline'}
            onClick={() => setLanguage('cs')}
          >
            CZ
          </Button>
          <Button
            variant={language === 'en' ? 'solid' : 'outline'}
            onClick={() => setLanguage('en')}
          >
            EN
          </Button>
        </ButtonGroup>
        {isAuthenticated ? (
          <Button onClick={handleLogout}>{texts.auth.logout[language]}</Button>
        ) : (
          <Button onClick={handleLogin}>{texts.auth.login[language]}</Button>
        )}
      </Flex>
    </Flex>
  );
};

export default Header;
