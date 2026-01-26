import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
  Badge,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
} from '@chakra-ui/react';
import { DeleteIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import { getChildren, deleteChild } from '../../services/api';
import { Child } from '../../types/child';
import { ROUTES } from '../../shared/route';
import AddChildModal from '../components/AddChildModal';
import React from 'react';

const ChildrenPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const toast = useToast();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef() as React.MutableRefObject<HTMLButtonElement>;
  const userRole = localStorage.getItem('userRole');
  const isParent = userRole === 'parent';

  const fetchChildren = useCallback(async () => {
    try {
      const data = await getChildren();
      setChildren(data);
    } catch (error) {
      console.error('Failed to fetch children:', error);
      toast({
        title: texts.profile.error[language],
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [language, toast]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleAddChildSuccess = async () => {
    await fetchChildren();
    toast({
      title: texts.profile.children.addChild.success[language],
      status: 'success',
      duration: 3000,
    });
  };

  const handleDeleteChild = async (childId: number) => {
    try {
      await deleteChild(childId);
      await fetchChildren();
      toast({
        title: texts.profile.children.deleteSuccess[language],
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: texts.profile.children.deleteError[language],
        status: 'error',
        duration: 3000,
      });
    }
    onClose();
  };

  const handleViewDetail = (childId: number) => {
    navigate(`${ROUTES.CHILDREN}/${childId}`);
  };

  return (
    <Box p={4}>
      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Heading>{texts.profile.children.title[language]}</Heading>
        {isParent && (
          <Button colorScheme="blue" onClick={() => setIsAddChildModalOpen(true)}>
            {texts.profile.children.addChild.title[language]}
          </Button>
        )}
      </Box>

      {children.length === 0 ? (
        <Text>{texts.profile.children.noChildren[language]}</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
            <Thead display={{ base: 'none', md: 'table-header-group' }}>
              <Tr>
                <Th>{texts.childrenTable.firstname[language]}</Th>
                <Th display={{ base: 'none', md: 'table-cell' }}>
                  {texts.childrenTable.surname[language]}
                </Th>
                <Th display={{ base: 'none', lg: 'table-cell' }}>
                  {texts.childrenTable.age[language]}
                </Th>
                <Th display={{ base: 'none', xl: 'table-cell' }}>
                  {texts.childrenTable.notes[language]}
                </Th>
                <Th>{texts.profile.children.viewDashboard[language]}</Th>
                <Th width="4"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {children.map((child, index) => (
                <Tr
                  key={child.id}
                  cursor="pointer"
                  transition="all 0.2s"
                  borderLeftWidth={{ base: '4px', md: '0' }}
                  borderLeftColor={{
                    base:
                      index % 3 === 0 ? 'blue.400' : index % 3 === 1 ? 'purple.400' : 'teal.400',
                    md: 'transparent',
                  }}
                  bg={{
                    base: index % 2 === 0 ? 'gray.50' : 'white',
                    md: 'transparent',
                  }}
                  _hover={{
                    bg: { base: 'gray.100', md: 'gray.50' },
                    transform: { base: 'translateX(2px)', md: 'none' },
                  }}
                  onClick={() => handleViewDetail(child.id)}
                >
                  <Td fontWeight={{ base: 'semibold', md: 'normal' }}>{child.firstname}</Td>
                  <Td display={{ base: 'none', md: 'table-cell' }}>{child.surname}</Td>
                  <Td display={{ base: 'none', lg: 'table-cell' }}>
                    {new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()}
                  </Td>
                  <Td display={{ base: 'none', xl: 'table-cell' }}>{child.notes}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        child.status === 'accepted'
                          ? 'green'
                          : child.status === 'denied'
                            ? 'red'
                            : 'yellow'
                      }
                    >
                      {child.status || 'pending'}
                    </Badge>
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    {isParent && (
                      <IconButton
                        aria-label="Delete child"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        onClick={() => {
                          setChildToDelete(child);
                          onOpen();
                        }}
                      />
                    )}
                    {!isParent && (
                      <ChevronRightIcon boxSize={6} color="gray.500" />
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {isParent && (
        <AddChildModal
          isOpen={isAddChildModalOpen}
          onClose={() => setIsAddChildModalOpen(false)}
          onSuccess={handleAddChildSuccess}
        />
      )}

      {isParent && (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader>
                {texts.profile.children.deleteConfirm.title[language]}
              </AlertDialogHeader>
              <AlertDialogBody>
                {texts.profile.children.deleteConfirm.message[language]}
                {childToDelete ? ` ${childToDelete.firstname} ${childToDelete.surname}?` : ''}
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  {texts.common.cancel[language]}
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => childToDelete && handleDeleteChild(childToDelete.id)}
                  ml={3}
                >
                  {texts.common.delete[language]}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </Box>
  );
};

export default ChildrenPage;
