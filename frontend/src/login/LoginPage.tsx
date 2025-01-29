import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  Input,
  VStack,
  Heading,
  Icon,
  Circle,
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Container maxW="md">
      <VStack spacing={8} mt={20}>
        <Circle size="40px" bg="purple.500" color="white">
          <Icon as={LockIcon} />
        </Circle>

        <Heading as="h1" size="lg">
          Sign in
        </Heading>

        <Box as="form" w="100%" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl>
              <Input
                name="email"
                type="email"
                placeholder="Email Address"
                required
                autoFocus
                value={formData.email}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl>
              <Input
                name="password"
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </FormControl>

            <Button type="submit" colorScheme="purple" width="100%" mt={4}>
              Sign In
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default LoginPage;
