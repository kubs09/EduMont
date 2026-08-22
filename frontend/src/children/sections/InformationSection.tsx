import React from 'react';
import { useColorModeValue } from '../../shared/contexts/ColorContext';
import {
  Box,
  Text,
  VStack,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { FiExternalLink } from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { Child } from '@frontend/types/child';
import { ROUTES } from '@frontend/shared/route';
import { formatDate } from '@frontend/shared/components/DatePicker/utils/utils';

interface InformationTabProps {
  childData: Child;
  language: 'cs' | 'en';
}

const InformationTab: React.FC<InformationTabProps> = ({ childData, language }) => {
  const navigate = useNavigate();
  const age = new Date().getFullYear() - new Date(childData.date_of_birth).getFullYear();
  const linkColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <VStack align="stretch" gap={{ base: 4, md: 6 }} overflowX="hidden">
      <Grid
        templateColumns={{ base: '1fr', md: '1fr 1fr' }}
        gap={{ base: 4, md: 6, lg: 8, xl: 10 }}
        w="100%"
      >
        <GridItem>
          <VStack align="stretch" gap={4}>
            <Box>
              <Text fontWeight="bold">{texts.common.childrenTable.age[language]}</Text>
              <Text>{age}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.children.dateOfBirth[language]}</Text>
              <Text>{formatDate(new Date(childData.date_of_birth), language)}</Text>
            </Box>
            {childData.notes && (
              <Box>
                <Text fontWeight="bold">{texts.common.childrenTable.notes[language]}</Text>
                <Text>{childData.notes}</Text>
              </Box>
            )}
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" gap={4}>
            <Box>
              <Text fontWeight="bold">{texts.common.childrenTable.class[language]}</Text>
              {childData.class_id ? (
                <HStack gap={2} align="center">
                  <Text>{childData.class_name}</Text>
                  <IconButton
                    aria-label={texts.classes.detail.title[language]}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (childData.class_id) {
                        navigate(ROUTES.CLASS_DETAIL.replace(':id', childData.class_id.toString()));
                      }
                    }}
                  >
                    <FiExternalLink />
                  </IconButton>
                </HStack>
              ) : (
                <Text>{texts.common.childrenTable.noClass[language]}</Text>
              )}
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.common.childrenTable.parent[language]}</Text>
              <VStack align="start" gap={1}>
                {childData.parents.map((parent) => {
                  const fullName = `${parent.firstname} ${parent.surname}`;
                  return (
                    <Text key={`${parent.id}`}>
                      <ChakraLink asChild color={linkColor}>
                        <RouterLink to={ROUTES.PROFILE_DETAIL.replace(':id', parent.id.toString())}>
                          {fullName}
                        </RouterLink>
                      </ChakraLink>
                    </Text>
                  );
                })}
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default InformationTab;
