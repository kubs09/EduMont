import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import api from '../../services/api';
import { ROUTES } from '../../shared/route';

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: Array<{
    id: number;
    firstname: string;
    surname: string;
  }>;
  children: Array<{
    id: number;
    firstname: string;
    surname: string;
    age: number;
    parent: string;
    contact: string;
  }>;
}

interface ClassHistory {
  id: number;
  date: string;
  notes: string;
  created_at: string;
  created_by: {
    id: number;
    firstname: string;
    surname: string;
  };
}

const ClassDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const toast = useToast();
  const [classData, setClassData] = useState<Class | null>(null);
  const [history, setHistory] = useState<ClassHistory[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newHistoryDate, setNewHistoryDate] = useState('');
  const [newHistoryNotes, setNewHistoryNotes] = useState('');

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const response = await api.get(`/api/classes/${id}`);
        setClassData(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load class data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await api.get(`/api/classes/${id}/history`);
        setHistory(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load class history',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchClassData();
    if (id) {
      fetchHistory();
    }
  }, [id, toast]);

  const handleAddHistory = async () => {
    try {
      await api.post(`/api/classes/${id}/history`, {
        date: newHistoryDate,
        notes: newHistoryNotes,
      });
      const response = await api.get(`/api/classes/${id}/history`);
      setHistory(response.data);
      onClose();
      setNewHistoryDate('');
      setNewHistoryNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add history entry',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    try {
      await api.delete(`/api/classes/${id}/history/${historyId}`);
      setHistory(history.filter((h) => h.id !== historyId));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete history entry',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!classData) {
    return null;
  }

  return (
    <Box p={4}>
      <Button leftIcon={<ChevronLeftIcon />} mb={4} onClick={() => navigate(ROUTES.CLASSES)}>
        {texts.classes.detail.backToList[language]}
      </Button>

      <Grid templateColumns="repeat(12, 1fr)" gap={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <Card>
            <CardHeader>
              <Heading size="md">{texts.classes.detail.info[language]}</Heading>
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
                  <Text fontWeight="bold">{texts.classes.detail.teachers[language]}</Text>
                  {classData.teachers.map((teacher) => (
                    <Text key={teacher.id}>
                      {teacher.firstname} {teacher.surname}
                    </Text>
                  ))}
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 8 }}>
          <Card>
            <CardHeader>
              <Heading size="md">{texts.classes.detail.students[language]}</Heading>
            </CardHeader>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>{texts.childrenTable.firstname[language]}</Th>
                    <Th>{texts.childrenTable.surname[language]}</Th>
                    <Th>{texts.childrenTable.age[language]}</Th>
                    <Th>{texts.childrenTable.parent[language]}</Th>
                    <Th>{texts.childrenTable.contact[language]}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {classData.children.map((child) => (
                    <Tr key={child.id}>
                      <Td>{child.firstname}</Td>
                      <Td>{child.surname}</Td>
                      <Td>{child.age}</Td>
                      <Td>{child.parent}</Td>
                      <Td>{child.contact}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <Card mt={6}>
        <CardHeader>
          <Heading size="md">{texts.classes.detail.history[language]}</Heading>
        </CardHeader>
        <CardBody>
          <Button mb={4} colorScheme="blue" onClick={onOpen}>
            {texts.classes.detail.addHistory[language]}
          </Button>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>{texts.classes.detail.date[language]}</Th>
                <Th>{texts.classes.detail.notes[language]}</Th>
                <Th>{texts.classes.detail.createdBy[language]}</Th>
                <Th>{texts.common.actions[language]}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {history.map((entry) => (
                <Tr key={entry.id}>
                  <Td>{new Date(entry.date).toLocaleDateString()}</Td>
                  <Td>{entry.notes}</Td>
                  <Td>{`${entry.created_by.firstname} ${entry.created_by.surname}`}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteHistory(entry.id)}
                    >
                      {texts.common.delete[language]}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{texts.classes.detail.addHistory[language]}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                type="date"
                value={newHistoryDate}
                onChange={(e) => setNewHistoryDate(e.target.value)}
              />
              <Textarea
                value={newHistoryNotes}
                onChange={(e) => setNewHistoryNotes(e.target.value)}
                placeholder={texts.classes.detail.notesPlaceholder[language]}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddHistory}>
              {texts.common.save[language]}
            </Button>
            <Button onClick={onClose}>{texts.common.cancel[language]}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ClassDetailPage;
