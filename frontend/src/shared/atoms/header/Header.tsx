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
  Show,
  Hide,
  Circle,
} from '@chakra-ui/react';
import { ChevronDownIcon, EmailIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { texts } from '../../../texts';
import { useLanguage } from '../../contexts/LanguageContext';
import { ROUTES } from '../../route';
import icon from './icon.png';
import { useState, useEffect } from 'react';
import { getMessages } from '../../../services/api';
import ColorModeToggle from '../color-mode-toggle';

const POLL_INTERVAL = 5000;

const Header = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  const isParent = userRole === 'parent';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const messages = await getMessages();
        const unread = messages.filter(
          (m) => m.to_user_id === parseInt(localStorage.getItem('userId') || '0') && !m.read_at
        ).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    if (isAuthenticated) {
      fetchUnreadCount(); // Initial fetch
      const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [isAuthenticated]);

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

  const handleClasses = () => {
    navigate(ROUTES.CLASSES);
  };

  const handleSchedule = () => {
    navigate(ROUTES.SCHEDULE);
  };

  const handleMessages = () => {
    navigate(ROUTES.MESSAGES);
  };

  const handleChildren = () => {
    navigate(ROUTES.CHILDREN);
  };

  return (
    <Flex
      as="header"
      p={{ base: 2, md: 4 }}
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
        <Flex align="center" gap={{ base: 2, md: 4 }}>
          <Image src={icon} alt="EduMont logo" height={{ base: '40px', md: '50px' }} />
          <Hide below="md">
            <Heading size={{ base: 'lg', md: 'xl' }}>EduMont</Heading>
          </Hide>
        </Flex>
      </Button>
      <Flex gap={{ base: 2, md: 4 }} align="center">
        {isAuthenticated && (
          <Button
            position="relative"
            leftIcon={<EmailIcon />}
            colorScheme="whiteAlpha"
            onClick={handleMessages}
            size={{ base: 'sm', md: 'md' }}
            px={{ base: 2, md: 4 }}
          >
            <Hide below="md">{texts.messages.title[language]}</Hide>
            {unreadCount > 0 && (
              <Circle
                size="20px"
                bg="red.500"
                color="white"
                position="absolute"
                top="-8px"
                right="-8px"
                fontSize="xs"
                fontWeight="bold"
              >
                {unreadCount}
              </Circle>
            )}
          </Button>
        )}
        <Show above="md">
          <ColorModeToggle size="md" />
        </Show>
        <Hide above="md">
          <ColorModeToggle size="sm" />
        </Hide>
        <ButtonGroup spacing={{ base: 1, md: 2 }}>
          <Button
            colorScheme="whiteAlpha"
            variant={language === 'cs' ? 'solid' : 'outline'}
            onClick={() => setLanguage('cs')}
            size={{ base: 'sm', md: 'md' }}
          >
            CZ
          </Button>
          <Button
            colorScheme="whiteAlpha"
            variant={language === 'en' ? 'solid' : 'outline'}
            onClick={() => setLanguage('en')}
            size={{ base: 'sm', md: 'md' }}
          >
            EN
          </Button>
        </ButtonGroup>
        {isAuthenticated ? (
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              colorScheme="whiteAlpha"
              size={{ base: 'sm', md: 'md' }}
            >
              <Hide below="md">{userName}</Hide>
              <Show below="md">👤</Show>
            </MenuButton>
            <MenuList bg="brand.primary.900" borderColor="whiteAlpha.300">
              <MenuItem
                bg="brand.primary.900"
                _hover={{ bg: 'brand.primary.800' }}
                onClick={handleProfile}
              >
                {texts.profile.menuItem[language]}
              </MenuItem>
              <MenuItem
                bg="brand.primary.900"
                _hover={{ bg: 'brand.primary.800' }}
                onClick={handleClasses}
              >
                {texts.classes.menuItem[language]}
              </MenuItem>
              {isParent && (
                <MenuItem
                  bg="brand.primary.900"
                  _hover={{ bg: 'brand.primary.800' }}
                  onClick={handleChildren}
                >
                  {texts.profile.children.menuItem[language]}
                </MenuItem>
              )}
              <MenuItem
                bg="brand.primary.900"
                _hover={{ bg: 'brand.primary.800' }}
                onClick={handleSchedule}
              >
                {texts.schedule.menuItem[language]}
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
                {texts.auth.signIn.logout[language]}
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button colorScheme="whiteAlpha" onClick={handleLogin} size={{ base: 'sm', md: 'md' }}>
            {texts.auth.signIn.loginButton[language]}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default Header;
