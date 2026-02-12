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
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { ROUTES } from '@frontend/shared/route';
import icon from './icon.png';
import { useState, useEffect } from 'react';
import { getMessages } from '@frontend/services/api';
import { getClasses } from '@frontend/services/api/class';
import { useAtomColors, useMenuColors } from '@frontend/design/colorModeUtils';

const POLL_INTERVAL = 5000;

const Header = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { bg: headerBg, color: headerColor } = useAtomColors();
  const { bg: menuBg, hoverBg: menuHoverBg, borderColor: menuBorderColor } = useMenuColors();
  const isAuthenticated = !!localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
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
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
      return () => clearInterval(interval);
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

  const handleClasses = async () => {
    if (!isTeacher) {
      navigate(ROUTES.CLASSES);
      return;
    }

    try {
      const classes = await getClasses();
      if (classes.length === 1) {
        navigate(ROUTES.CLASS_DETAIL.replace(':id', classes[0].id.toString()));
        return;
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }

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
      bg={headerBg}
      color={headerColor}
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
            variant="brand"
            leftIcon={<EmailIcon />}
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
        <ButtonGroup spacing={{ base: 1, md: 2 }}>
          <Button
            variant={language === 'cs' ? 'brand' : 'outline'}
            onClick={() => setLanguage('cs')}
            size={{ base: 'sm', md: 'md' }}
            _hover={language === 'cs' ? {} : undefined}
            _dark={language === 'cs' ? { _hover: {} } : undefined}
          >
            CZ
          </Button>
          <Button
            variant={language === 'en' ? 'brand' : 'outline'}
            onClick={() => setLanguage('en')}
            size={{ base: 'sm', md: 'md' }}
            _hover={language === 'en' ? {} : undefined}
            _dark={language === 'en' ? { _hover: {} } : undefined}
          >
            EN
          </Button>
        </ButtonGroup>
        {isAuthenticated ? (
          <Menu>
            <MenuButton
              variant="brand"
              as={Button}
              rightIcon={<ChevronDownIcon />}
              size={{ base: 'sm', md: 'md' }}
            >
              <Hide below="md">{userName}</Hide>
              <Show below="md">👤</Show>
            </MenuButton>
            <MenuList bg={menuBg} borderColor={menuBorderColor}>
              <MenuItem bg={menuBg} _hover={{ bg: menuHoverBg }} onClick={handleProfile}>
                {texts.profile.menuItem[language]}
              </MenuItem>
              <MenuItem bg={menuBg} _hover={{ bg: menuHoverBg }} onClick={handleClasses}>
                {isTeacher && <>{texts.classes.teacherClassMenuItem[language]}</>}
                {!isTeacher && <>{texts.classes.menuItem[language]}</>}
              </MenuItem>
              <MenuItem bg={menuBg} _hover={{ bg: menuHoverBg }} onClick={handleChildren}>
                {isParent && <>{texts.profile.children.menuItem[language]}</>}{' '}
                {isAdmin && <>{texts.students[language]}</>}
                {isTeacher && <>{texts.classes.teacherMenuItem[language]}</>}
              </MenuItem>
              {isAdmin && (
                <>
                  <MenuItem bg={menuBg} _hover={{ bg: menuHoverBg }} onClick={handleSchedule}>
                    {texts.schedule.menuItem[language]}
                  </MenuItem>
                  <MenuItem bg={menuBg} _hover={{ bg: menuHoverBg }} onClick={handleUserDashboard}>
                    {texts.userDashboard.menuItem[language]}
                  </MenuItem>
                </>
              )}
              <MenuItem bg={menuBg} _hover={{ bg: menuHoverBg }} onClick={handleLogout}>
                {texts.auth.signIn.logout[language]}
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button variant="brand" onClick={handleLogin} size={{ base: 'sm', md: 'md' }}>
            {texts.auth.signIn.loginButton[language]}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default Header;
