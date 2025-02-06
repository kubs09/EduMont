import { useState, useEffect } from 'react';
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
  VStack,
  useToast,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { texts } from '../../texts';
import { useLanguage } from '../../shared/contexts/LanguageContext';
import api from '../../services/api';
import { ManageClassModal } from '../components/ManageClassModal';

interface Teacher {
  id: number;
  firstname: string;
  surname: string;
  role: string;
}

interface Child {
  id: number;
  firstname: string;
  surname: string;
}

interface Class {
  id: number;
  name: string;
  description: string;
  teachers: Teacher[];
  children: Child[];
}

interface User {
  id: number;
  firstname: string;
  surname: string;
  role: string;
}

const ClassesPage = () => {
  const { language } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);
  const [availableChildren, setAvailableChildren] = useState<Child[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userJson = localStorage.getItem('user');
        const userInfo = userJson ? JSON.parse(userJson) : null;
        const isUserAdmin = userInfo?.role === 'admin';
        setIsAdmin(isUserAdmin);

        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);

        if (isUserAdmin) {
          const [teachersResponse, childrenResponse] = await Promise.all([
            api.get('/api/users?role=teacher'),
            api.get('/api/children'),
          ]);
          setAvailableTeachers(teachersResponse.data);
          setAvailableChildren(childrenResponse.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [toast]);

  const handleManageClass = (cls: Class) => {
    setSelectedClass(cls);
    onOpen();
  };

  const handleSaveChanges = async (
    classId: number,
    newTeachers: number[],
    newChildren: number[]
  ) => {
    try {
      await api.put(`/api/classes/${classId}`, {
        teacherIds: newTeachers,
        childrenIds: newChildren,
      });

      const updatedClasses = await api.get('/api/classes');
      setClasses(updatedClasses.data);

      toast({
        title: texts.classes.updateSuccess[language],
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: texts.classes.updateError[language],
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <Heading mb={6}>{texts.classes.title[language]}</Heading>
      {classes.length === 0 ? (
        <Text>{texts.classes.noClasses[language]}</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{texts.classes.name[language]}</Th>
              <Th>{texts.classes.description[language]}</Th>
              <Th>{texts.classes.teachers[language]}</Th>
              <Th>{texts.classes.children[language]}</Th>
              {isAdmin && <Th width="150px">{texts.classes.action[language]}</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {classes.map((cls) => (
              <Tr key={cls.id}>
                <Td>{cls.name}</Td>
                <Td>{cls.description}</Td>
                <Td>
                  <VStack align="start">
                    {cls.teachers.map((teacher) => (
                      <Text key={teacher.id}>
                        {teacher.firstname} {teacher.surname}
                      </Text>
                    ))}
                  </VStack>
                </Td>
                <Td>
                  <VStack align="start">
                    {cls.children.map((child) => (
                      <Text key={child.id}>
                        {child.firstname} {child.surname}
                      </Text>
                    ))}
                  </VStack>
                </Td>
                {isAdmin && (
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      width="100%"
                      onClick={() => handleManageClass(cls)}
                    >
                      {texts.classes.manageClass[language]}
                    </Button>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {selectedClass && (
        <ManageClassModal
          isOpen={isOpen}
          onClose={onClose}
          selectedClass={selectedClass}
          availableTeachers={availableTeachers}
          availableChildren={availableChildren}
          onSave={handleSaveChanges}
          onClassUpdate={setSelectedClass}
        />
      )}
    </Box>
  );
};

export default ClassesPage;
