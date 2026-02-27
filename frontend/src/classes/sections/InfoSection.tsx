import React from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Grid,
  GridItem,
  Link as ChakraLink,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { Class } from '@frontend/types/class';
import { ROUTES } from '@frontend/shared/route';
import { classAgeGroups } from '../utils/ageGroups';

interface InfoTabProps {
  classData: Class;
  language: 'cs' | 'en';
  isAdmin: boolean;
  premissionRequested: boolean;
  onEditClick: () => void;
  onEditMembersClick: () => void;
  onAcceptPermission: () => void;
  onDenyPermission: () => void;
}

const InfoTab: React.FC<InfoTabProps> = ({
  classData,
  language,
  isAdmin,
  premissionRequested,
  onEditClick,
  onEditMembersClick,
  onAcceptPermission,
  onDenyPermission,
}) => {
  const primaryTeacher = classData.teachers.find((teacher) => teacher.class_role === 'teacher');
  const assistantTeacher = classData.teachers.find((teacher) => teacher.class_role === 'assistant');
  const ageGroup = classAgeGroups.find(
    (group) => group.minAge === classData.min_age && group.maxAge === classData.max_age
  );
  const ageGroupsLabel = ageGroup
    ? `${texts.classes.ageGroups[ageGroup.key][language]} - ${classData.min_age} - ${classData.max_age} ${texts.classes.years[language]}`
    : `${classData.min_age} - ${classData.max_age}`;

  const renderTeacherName = (teacher?: Class['teachers'][number]) => {
    if (!teacher) return '-';
    const fullName = `${teacher.firstname} ${teacher.surname}`;
    return (
      <ChakraLink
        as={RouterLink}
        to={ROUTES.PROFILE_DETAIL.replace(':id', teacher.id.toString())}
        variant="link"
      >
        {fullName}
      </ChakraLink>
    );
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 4, md: 6, lg: 8 }}>
        <GridItem>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold">{texts.classes.name[language]}</Text>
              <Text>{classData.name}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.classes.description[language]}</Text>
              <Text>{classData.description}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.classes.ageRange[language]}</Text>
              <Text>{ageGroupsLabel}</Text>
            </Box>
          </VStack>
        </GridItem>
        <GridItem>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold">{texts.classes.detail.teacher[language]}</Text>
              <Text>{renderTeacherName(primaryTeacher)}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.classes.assistant[language]}</Text>
              <Text>{renderTeacherName(assistantTeacher)}</Text>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
      {isAdmin && (
        <Stack mt={2} direction={{ base: 'column', sm: 'row' }} spacing={4} w="full">
          <Button variant="brand" onClick={onEditClick} size="md" w={{ base: 'full', sm: 'auto' }}>
            {texts.classes.editInfo[language]}
          </Button>
          <Button
            variant="brand"
            onClick={onEditMembersClick}
            size="md"
            w={{ base: 'full', sm: 'auto' }}
          >
            {texts.classes.teachers[language]}
          </Button>
        </Stack>
      )}
      {!isAdmin && premissionRequested && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <Text>{texts.classes.detail.permissionRequestMessage[language]}</Text>
            <Stack mt={3} direction={{ base: 'column', sm: 'row' }} spacing={3}>
              <Button
                colorScheme="green"
                onClick={onAcceptPermission}
                size="sm"
                w={{ base: 'full', sm: 'auto' }}
              >
                {texts.classes.detail.premissionAcceptButton[language]}
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={onDenyPermission}
                size="sm"
                w={{ base: 'full', sm: 'auto' }}
              >
                {texts.classes.detail.permissionDenyButton[language]}
              </Button>
            </Stack>
          </Box>
        </Alert>
      )}
    </VStack>
  );
};

export default InfoTab;
