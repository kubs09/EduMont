import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Table,
  Text,
  IconButton,
  useDisclosure,
  Button,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { FiTrash2, FiChevronRight } from 'react-icons/fi';
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
import { useAppToast } from '@frontend/shared/hooks/useAppToast';

const ChildrenPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const toast = useAppToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const { open, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const userRole = localStorage.getItem('userRole');
  const isParent = userRole === 'parent';
  const isAdmin = userRole === 'admin';
  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  const formatParentNames = (parents: Child['parents']) =>
    parents.map((parent) => `${parent.firstname} ${parent.surname}`);

  const formatParentEmails = (parents: Child['parents']) => parents.map((parent) => parent.email);

  const fetchChildren = useCallback(async () => {
    try {
      const data = await getChildren();
      setChildren(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch children:', error);
      toast({
        title: texts.children.errors.fetchFailed.title[language],
        description: texts.children.errors.fetchFailed.description[language],
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
      title: texts.children.success.added[language],
      status: 'success',
      duration: 3000,
    });
  };

  const handleDeleteChild = async (childId: number) => {
    try {
      await deleteChild(childId);
      await fetchChildren();
      toast({
        title: texts.children.success.deleted[language],
        status: 'success',
        duration: 3000,
      });
    } catch {
      toast({
        title: texts.children.errors.deleteFailed.title[language],
        description: texts.children.errors.deleteFailed.description[language],
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
          <Heading>{texts.children.titleParent[language]}</Heading>
        ) : (
          <Heading>{texts.children.title[language]}</Heading>
        )}
        {isAdmin && (
          <Button variant="brand" onClick={() => setIsAddChildModalOpen(true)}>
            {texts.children.addChild.title[language]}
          </Button>
        )}
      </Box>

      {children.length === 0 ? (
        <Text>{texts.children.noChildren[language]}</Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root variant="simple" size={{ base: 'sm', md: 'md' }}>
            <Table.Header display={{ base: 'none', md: 'table-header-group' }}>
              <Table.Row>
                <Table.ColumnHeader>
                  {texts.common.childrenTable.firstname[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>
                  {texts.common.childrenTable.surname[language]}
                </Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', lg: 'table-cell' }}>
                  {texts.common.childrenTable.age[language]}
                </Table.ColumnHeader>
                {!isParent && (
                  <>
                    <Table.ColumnHeader display={{ base: 'none', xl: 'table-cell' }}>
                      {texts.common.childrenTable.parent[language]}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader display={{ base: 'none', xl: 'table-cell' }}>
                      {texts.common.childrenTable.parentEmail[language]}
                    </Table.ColumnHeader>
                  </>
                )}
                <Table.ColumnHeader display={{ base: 'none', xl: 'table-cell' }}>
                  {texts.common.actions[language]}
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginatedChildren.map((child, index) => (
                <Table.Row
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
                  <Table.Cell fontWeight={{ base: 'semibold', md: 'normal' }}>
                    {child.firstname}
                  </Table.Cell>
                  <Table.Cell display={{ base: 'none', md: 'table-cell' }}>
                    {child.surname}
                  </Table.Cell>
                  <Table.Cell display={{ base: 'none', lg: 'table-cell' }}>
                    {new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()}
                  </Table.Cell>
                  {!isParent && (
                    <>
                      <Table.Cell display={{ base: 'none', xl: 'table-cell' }}>
                        <VStack align="start" gap={1}>
                          {formatParentNames(child.parents).map((name, parentIndex) => (
                            <Text key={`${child.id}-parent-name-${parentIndex}`}>{name}</Text>
                          ))}
                        </VStack>
                      </Table.Cell>
                      <Table.Cell display={{ base: 'none', xl: 'table-cell' }}>
                        <VStack align="start" gap={1}>
                          {formatParentEmails(child.parents).map((email, parentIndex) => (
                            <Text key={`${child.id}-parent-email-${parentIndex}`}>{email}</Text>
                          ))}
                        </VStack>
                      </Table.Cell>
                    </>
                  )}
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    {isAdmin && (
                      <IconButton
                        aria-label="Delete child"
                        colorPalette="red"
                        size="sm"
                        onClick={() => {
                          setChildToDelete(child);
                          onOpen();
                        }}
                      >
                        <FiTrash2 />
                      </IconButton>
                    )}
                    {!isAdmin && <Icon as={FiChevronRight} boxSize={6} color="text-muted" />}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
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
          isOpen={open}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
          onConfirm={() => childToDelete && handleDeleteChild(childToDelete.id)}
          title={texts.children.deleteConfirm.title[language]}
          message={`${texts.children.deleteConfirm.message[language]}${
            childToDelete ? ` ${childToDelete.firstname} ${childToDelete.surname}?` : ''
          }`}
          cancelLabel={texts.common.cancel[language]}
          confirmLabel={texts.common.delete[language]}
          confirmColorScheme="red"
        />
      )}
    </Box>
  );
};

export default ChildrenPage;
