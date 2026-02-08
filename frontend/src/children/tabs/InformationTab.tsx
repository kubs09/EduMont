import React from 'react';
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
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { Child } from '@frontend/types/child';
import { ROUTES } from '@frontend/shared/route';
import { formatDate } from '@frontend/shared/components/DatePicker/utils/utils';

interface InformationTabProps {
  childData: Child;
  language: 'cs' | 'en';
  canEdit: boolean;
  canViewParentProfile: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const InformationTab: React.FC<InformationTabProps> = ({
  childData,
  language,
  canEdit,
  canViewParentProfile,
  onEditClick,
  onDeleteClick,
}) => {
  const navigate = useNavigate();
  const age = new Date().getFullYear() - new Date(childData.date_of_birth).getFullYear();

  return (
    <VStack align="stretch" spacing={{ base: 4, md: 6 }} overflowX="hidden">
      <Grid
        templateColumns={{ base: '1fr', md: '1fr 1fr' }}
        gap={{ base: 4, md: 6, lg: 8, xl: 10 }}
        w="100%"
      >
        <GridItem>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold">{texts.childrenTable.age[language]}</Text>
              <Text>{age}</Text>
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.profile.children.dateOfBirth[language]}</Text>
              <Text>{formatDate(new Date(childData.date_of_birth), language)}</Text>
            </Box>
            {childData.notes && (
              <Box>
                <Text fontWeight="bold">{texts.childrenTable.notes[language]}</Text>
                <Text>{childData.notes}</Text>
              </Box>
            )}
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold">{texts.childrenTable.class[language]}</Text>
              {childData.class_id ? (
                <HStack spacing={2} align="center">
                  <Text>{childData.class_name}</Text>
                  <IconButton
                    aria-label={texts.classes.detail.title[language]}
                    icon={<ExternalLinkIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (childData.class_id) {
                        navigate(ROUTES.CLASS_DETAIL.replace(':id', childData.class_id.toString()));
                      }
                    }}
                  />
                </HStack>
              ) : (
                <Text>{texts.childrenTable.noClass[language]}</Text>
              )}
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.childrenTable.parent[language]}</Text>
              <VStack align="start" spacing={1}>
                {childData.parents.map((parent) => {
                  const fullName = `${parent.firstname} ${parent.surname}`;
                  return (
                    <Text key={`${parent.id}`}>
                      <ChakraLink
                        as={RouterLink}
                        to={ROUTES.PROFILE_DETAIL.replace(':id', parent.id.toString())}
                        color="blue.600"
                      >
                        {fullName}
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
