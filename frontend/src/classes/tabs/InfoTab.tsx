import React from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { Class } from '@frontend/types/class';

interface InfoTabProps {
  classData: Class;
  language: 'cs' | 'en';
  isAdmin: boolean;
  onEditClick: () => void;
  onEditMembersClick: () => void;
}

const InfoTab: React.FC<InfoTabProps> = ({
  classData,
  language,
  isAdmin,
  onEditClick,
  onEditMembersClick,
}) => {
  return (
    <VStack align="stretch" spacing={6}>
      <Card>
        <CardHeader>
          <Heading size={{ base: 'sm', md: 'md' }}>{texts.classes.detail.info[language]}</Heading>
        </CardHeader>
        <CardBody>
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
              <Text>{`${classData.min_age} - ${classData.max_age}`}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.classes.detail.teachers[language]}</Text>
              {classData.teachers.map((teacher) => (
                <Text key={teacher.id}>
                  {teacher.firstname} {teacher.surname}
                </Text>
              ))}
            </Box>
          </VStack>
          {isAdmin && (
            <Stack mt={4} direction={{ base: 'column', sm: 'row' }} spacing={4} w="full">
              <Button
                variant="brand"
                onClick={onEditClick}
                size="md"
                w={{ base: 'full', sm: 'auto' }}
              >
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
        </CardBody>
      </Card>
    </VStack>
  );
};

export default InfoTab;
