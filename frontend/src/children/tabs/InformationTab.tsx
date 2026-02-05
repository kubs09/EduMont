import React from 'react';
import { Box, Text, VStack, Grid, GridItem } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { Child } from '@frontend/types/child';
import { ROUTES } from '@frontend/shared/route';

interface InformationTabProps {
  childData: Child;
  language: 'cs' | 'en';
  canEdit: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const InformationTab: React.FC<InformationTabProps> = ({
  childData,
  language,
  canEdit,
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
              <Text>{new Date(childData.date_of_birth).toLocaleDateString(language)}</Text>
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
                <Text
                  as="button"
                  color="blue.500"
                  textDecoration="underline"
                  cursor="pointer"
                  _hover={{ color: 'blue.700' }}
                  onClick={() => {
                    if (childData.class_id) {
                      navigate(ROUTES.CLASS_DETAIL.replace(':id', childData.class_id.toString()));
                    }
                  }}
                >
                  {childData.class_name}
                </Text>
              ) : (
                <Text>Not assigned to a class</Text>
              )}
            </Box>
            <Box>
              <Text fontWeight="bold">{texts.childrenTable.parent[language]}</Text>
              <Text>
                {childData.parent_firstname} {childData.parent_surname}
              </Text>
            </Box>
            {childData.parent_email && (
              <Box>
                <Text fontWeight="bold">{texts.profile.email[language]}</Text>
                <Text>{childData.parent_email}</Text>
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default InformationTab;
