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
  IconButton,
  useDisclosure,
  Button,
} from '@chakra-ui/react';
import { DeleteIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { getChildren, deleteChild } from '@frontend/services/api';
import { Child } from '@frontend/types/child';
import { ROUTES } from '@frontend/shared/route';
import AddChildModal from '../components/AddChildModal';
import React from 'react';
import { ConfirmDialog } from '@frontend/shared/components/ConfirmDialog';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@frontend/shared/components';

const ChildrenPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef() as React.MutableRefObject<HTMLButtonElement>;
  const userRole = localStorage.getItem('userRole');
  const isParent = userRole === 'parent';
  const isAdmin = userRole === 'admin';
  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  const fetchChildren = useCallback(async () => {
    try {
      const data = await getChildren();
      setChildren(data);
      setCurrentPage(1);
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

  const totalPages = Math.ceil(children.length / PAGE_SIZE);
  const paginatedChildren = children.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <Box p={4}>
      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        {isParent ? (
          <Heading>{texts.profile.children.titleParent[language]}</Heading>
        ) : (
          <Heading>{texts.profile.children.title[language]}</Heading>
        )}
        {isAdmin && (
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
                <Th width="4"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedChildren.map((child, index) => (
                <Tr
                  key={child.id}
                  cursor="pointer"
                  transition="all 0.2s"
                  borderLeftWidth={{ base: '4px', md: '0' }}
                  borderLeftColor={{
                    base:
                      ((currentPage - 1) * PAGE_SIZE + index) % 3 === 0
                        ? 'blue.400'
                        : ((currentPage - 1) * PAGE_SIZE + index) % 3 === 1
                          ? 'purple.400'
                          : 'teal.400',
                    md: 'transparent',
                  }}
                  bg={{
                    base: ((currentPage - 1) * PAGE_SIZE + index) % 2 === 0 ? 'gray.50' : 'white',
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
                  <Td onClick={(e) => e.stopPropagation()}>
                    {isAdmin && (
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
                    {!isAdmin && <ChevronRightIcon boxSize={6} color="gray.500" />}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            totalCount={children.length}
          />
        </Box>
      )}

      {isAdmin && (
        <AddChildModal
          isOpen={isAddChildModalOpen}
          onClose={() => setIsAddChildModalOpen(false)}
          onSuccess={handleAddChildSuccess}
        />
      )}

      {isAdmin && (
        <ConfirmDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
          onConfirm={() => childToDelete && handleDeleteChild(childToDelete.id)}
          title={texts.profile.children.deleteConfirm.title[language]}
          message={`${texts.profile.children.deleteConfirm.message[language]}${childToDelete ? ` ${childToDelete.firstname} ${childToDelete.surname}?` : ''}`}
          cancelLabel={texts.common.cancel[language]}
          confirmLabel={texts.common.delete[language]}
          confirmColorScheme="red"
        />
      )}
    </Box>
  );
};

export default ChildrenPage;
