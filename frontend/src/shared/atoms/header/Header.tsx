import {
  Button,
  Flex,
  Heading,
  ButtonGroup,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { texts } from '../../../texts';
import { useLanguage } from '../../contexts/LanguageContext';
import { ROUTES } from '../../route';
import icon from './icon.png';

const Header = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    window.location.href = ROUTES.LOGIN;
  };

  const handleLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleProfile = () => {
    navigate(ROUTES.PROFILE);
  };

  const handleUserDashboard = () => {
    navigate(ROUTES.USER_DASHBOARD);
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
      <Button
        variant="unstyled"
        onClick={() => navigate(ROUTES.HOME)}
        _hover={{ opacity: 0.8 }}
        display="flex"
        alignItems="center"
      >
        <Flex align="center" gap={4}>
          <Image src={icon} alt="EduMont logo" height="50px" />
          <Heading size="xl">EduMont</Heading>
        </Flex>
      </Button>
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
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="whiteAlpha">
              {userName}
            </MenuButton>
            <MenuList bg="brand.primary.900" borderColor="whiteAlpha.300">
              <MenuItem
                bg="brand.primary.900"
                _hover={{ bg: 'brand.primary.800' }}
                onClick={handleProfile}
              >
                {texts.profile.menuItem[language]}
              </MenuItem>
              {isAdmin && (
                <MenuItem
                  bg="brand.primary.900"
                  _hover={{ bg: 'brand.primary.800' }}
                  onClick={handleUserDashboard}
                >
                  {texts.userDashboard.menuItem[language]}
                </MenuItem>
              )}
              <MenuItem
                bg="brand.primary.900"
                _hover={{ bg: 'brand.primary.800' }}
                onClick={handleLogout}
              >
                {texts.auth.logout[language]}
              </MenuItem>
            </MenuList>
          </Menu>
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
