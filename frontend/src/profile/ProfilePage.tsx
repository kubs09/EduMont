import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Button,
  useToast,
  useColorModeValue,
  Flex,
  VStack,
  HStack,
  IconButton,
  Collapse,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { ROUTES } from '@frontend/shared/route';
import { updateNotificationSettings } from '@frontend/services/api';
import { ClassSection, ContactSection, ChildrenSection, SettingsSection } from './sections';

const ProfilePage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || '';
  const userName = localStorage.getItem('userName') || '';
  const userRole = localStorage.getItem('userRole') || '';
  const [firstName, lastName] = userName.split(' ');
  const toast = useToast();
  const subtleBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const [messageNotifications, setMessageNotifications] = useState<boolean>(() => {
    const userSettings = localStorage.getItem('userSettings');
    if (userSettings) {
      const settings = JSON.parse(userSettings);
      return settings.messageNotifications ?? true;
    }
    return true;
  });
  const userId = parseInt(localStorage.getItem('userId') || '0');
  const userPhone = localStorage.getItem('userPhone') || '';
  const menuBg = useColorModeValue('bg-surface', 'bg-surface');
  const menuActiveBg = useColorModeValue('gray.100', 'whiteAlpha.200');
  const menuActiveColor = useColorModeValue('gray.900', 'white');
  const menuTextColor = useColorModeValue('gray.700', 'whiteAlpha.800');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  type SectionKey = 'contact' | 'class' | 'children' | 'settings';
  const [activeSection, setActiveSection] = useState<SectionKey>('contact');

  const sections = [
    {
      key: 'contact' as const,
      label: texts.profile.contactInfo[language],
      isVisible: true,
    },
    {
      key: 'class' as const,
      label: texts.classes.teacherClassMenuItem[language],
      isVisible: userRole === 'teacher',
    },
    {
      key: 'children' as const,
      label: texts.profile.children.menuItem[language],
      isVisible: userRole === 'parent',
    },
    {
      key: 'settings' as const,
      label: texts.profile.settingsMenu[language],
      isVisible: true,
    },
  ];

  const visibleSections = sections.filter((section) => section.isVisible);

  useEffect(() => {
    const userSettings = localStorage.getItem('userSettings');
    if (userSettings) {
      const { messageNotifications } = JSON.parse(userSettings);
      setMessageNotifications(messageNotifications);
    }
  }, [language, toast]);

  useEffect(() => {
    if (!visibleSections.some((section) => section.key === activeSection)) {
      setActiveSection(visibleSections[0]?.key ?? 'contact');
    }
  }, [activeSection, visibleSections]);

  useEffect(() => {
    if (isMobile === undefined) return;
    setIsMenuOpen(!isMobile);
  }, [isMobile]);

  const handleNotificationToggle = async () => {
    try {
      await updateNotificationSettings(userId, { messageNotifications: !messageNotifications });
      setMessageNotifications(!messageNotifications);
      localStorage.setItem(
        'userSettings',
        JSON.stringify({ messageNotifications: !messageNotifications })
      );
      toast({
        title: texts.profile.notifications.updateSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: texts.profile.notifications.updateError[language],
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditProfile = () => navigate(ROUTES.PROFILE_EDIT);
  const handleOpenClasses = () => navigate(ROUTES.CLASSES);
  const handleOpenChildren = () => navigate(ROUTES.CHILDREN);

  return (
    <Box maxW={{ base: 'full', md: 'container.lg' }} mx="auto" px={{ base: 2, md: 0 }}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 4, md: 6 }} align="start">
        <Card
          w={{ base: 'full', md: '240px' }}
          bg={menuBg}
          position={{ base: 'static', md: 'sticky' }}
          top={{ md: 6 }}
        >
          <CardBody p={{ base: 2, md: 4 }}>
            <HStack justify="space-between" mb={{ base: 2, md: 4 }}>
              <Heading size={{ base: 'sm', md: 'md' }}>{texts.profile.title[language]}</Heading>
              {isMobile && (
                <IconButton
                  aria-label={texts.profile.title[language]}
                  icon={isMenuOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen((open) => !open)}
                />
              )}
            </HStack>
            <Collapse in={!isMobile || isMenuOpen} animateOpacity>
              <VStack spacing={{ base: 1, md: 2 }} align="stretch">
                {visibleSections.map((section) => {
                  const isActive = section.key === activeSection;
                  return (
                    <Button
                      key={section.key}
                      variant="ghost"
                      justifyContent="flex-start"
                      size={{ base: 'sm', md: 'md' }}
                      onClick={() => setActiveSection(section.key)}
                      bg={isActive ? menuActiveBg : 'transparent'}
                      color={isActive ? menuActiveColor : menuTextColor}
                      fontWeight={isActive ? 'semibold' : 'normal'}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {section.label}
                    </Button>
                  );
                })}
              </VStack>
            </Collapse>
          </CardBody>
        </Card>

        <Box flex="1" w={{ base: 'full', md: 'auto' }}>
          {activeSection === 'contact' && (
            <ContactSection
              firstName={firstName}
              lastName={lastName}
              userEmail={userEmail}
              userPhone={userPhone}
              userRole={userRole}
              subtleBg={subtleBg}
              onEditProfile={handleEditProfile}
            />
          )}

          {activeSection === 'class' && userRole === 'teacher' && (
            <ClassSection onOpenClasses={handleOpenClasses} subtleBg={subtleBg} />
          )}

          {activeSection === 'children' && userRole === 'parent' && (
            <ChildrenSection onOpenChildren={handleOpenChildren} subtleBg={subtleBg} />
          )}

          {activeSection === 'settings' && (
            <SettingsSection
              messageNotifications={messageNotifications}
              onToggleNotifications={handleNotificationToggle}
            />
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default ProfilePage;
