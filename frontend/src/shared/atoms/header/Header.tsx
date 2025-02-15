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
  Box,
} from '@chakra-ui/react';
import { ChevronDownIcon, EmailIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { texts } from '../../../texts';
import { useLanguage } from '../../contexts/LanguageContext';
import { ROUTES } from '../../route';
import icon from './icon.png';
import { useState, useEffect, useRef } from 'react';
import { getMessages } from '../../../services/api';
import { AdmissionRequiredError } from '../../../types/errors';

const POLL_INTERVAL = 5000;

const Header: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  const isParent = userRole === 'parent';
  const admissionStatus = isParent ? localStorage.getItem('admissionStatus') : null;
  const isPendingAdmission = isParent && admissionStatus === 'pending';
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const messages = await getMessages();
        const unread = messages.filter(
          (m) => m.to_user_id === parseInt(localStorage.getItem('userId') || '0') && !m.read_at
        ).length;
        setUnreadCount(unread);
      } catch (error) {
        if (error instanceof AdmissionRequiredError || error instanceof Error) {
          setHasError(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }
    };

    if (isAuthenticated && !hasError) {
      fetchUnreadCount(); // Initial fetch
      intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, hasError]);

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

  const handleMessages = () => {
    navigate(ROUTES.MESSAGES);
  };

  const handleAdmissionDashboard = () => {
    navigate(ROUTES.ADMIN_ADMISSIONS);
  };

  return (
    <Box position="relative">
      <Flex
        as="header"
        p={{ base: 2, md: 4 }}
        bg="gradient.header"
        justify="space-between"
        align="center"
        position="sticky"
        top={0}
        zIndex={1000}
        boxShadow="lg"
      >
        {/* Logo and Title Section */}
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
              <Heading
                size={{ base: 'lg', md: 'xl' }}
                color="white"
                letterSpacing="tight"
                fontWeight="bold"
              >
                EduMont
              </Heading>
            </Hide>
          </Flex>
        </Button>

        {/* Right Section */}
        <Flex gap={{ base: 2, md: 4 }} align="center">
          {isAuthenticated && !isPendingAdmission && !hasError && (
            <Button
              position="relative"
              leftIcon={<EmailIcon />}
              variant="ghost"
              color="white"
              onClick={handleMessages}
              size={{ base: 'sm', md: 'md' }}
              px={{ base: 2, md: 4 }}
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)',
              }}
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
              bg={language === 'cs' ? 'gradient.primary' : 'transparent'}
              color="white"
              border="2px"
              borderColor={language === 'cs' ? 'transparent' : 'whiteAlpha.400'}
              onClick={() => setLanguage('cs')}
              size={{ base: 'sm', md: 'md' }}
              fontWeight="bold"
              transition="all 0.2s"
              _hover={{
                bg: language === 'cs' ? 'gradient.primary' : 'whiteAlpha.200',
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
            >
              CZ
            </Button>
            <Button
              bg={language === 'en' ? 'gradient.primary' : 'transparent'}
              color="white"
              border="2px"
              borderColor={language === 'en' ? 'transparent' : 'whiteAlpha.400'}
              onClick={() => setLanguage('en')}
              size={{ base: 'sm', md: 'md' }}
              fontWeight="bold"
              transition="all 0.2s"
              _hover={{
                bg: language === 'en' ? 'gradient.primary' : 'whiteAlpha.200',
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
            >
              EN
            </Button>
          </ButtonGroup>
          {isAuthenticated ? (
            isPendingAdmission ? (
              <Button
                variant="ghost"
                color="white"
                onClick={handleLogout}
                size={{ base: 'sm', md: 'md' }}
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                {texts.auth.logout[language]}
              </Button>
            ) : (
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  variant="ghost"
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  <Hide below="md">{userName}</Hide>
                  <Show below="md">👤</Show>
                </MenuButton>
                <MenuList bg="blue.500" borderColor="whiteAlpha.200">
                  <MenuItem
                    bg="transparent"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={handleProfile}
                  >
                    {texts.profile.menuItem[language]}
                  </MenuItem>
                  <MenuItem
                    bg="transparent"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={handleClasses}
                  >
                    {texts.classes.menuItem[language]}
                  </MenuItem>
                  {isAdmin && (
                    <>
                      <MenuItem
                        bg="transparent"
                        color="white"
                        _hover={{ bg: 'whiteAlpha.200' }}
                        onClick={handleAdmissionDashboard}
                      >
                        {texts.dashboard.menuItem[language]}
                      </MenuItem>
                      <MenuItem
                        bg="transparent"
                        color="white"
                        _hover={{ bg: 'whiteAlpha.200' }}
                        onClick={handleUserDashboard}
                      >
                        {texts.userDashboard.menuItem[language]}
                      </MenuItem>
                    </>
                  )}
                  <MenuItem
                    bg="transparent"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={handleLogout}
                  >
                    {texts.auth.logout[language]}
                  </MenuItem>
                </MenuList>
              </Menu>
            )
          ) : (
            <Button
              variant="outline"
              color="white"
              borderColor="white"
              onClick={handleLogin}
              size={{ base: 'sm', md: 'md' }}
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)',
              }}
            >
              {texts.auth.login[language]}
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
