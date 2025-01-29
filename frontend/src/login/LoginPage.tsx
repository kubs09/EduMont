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
  Text,
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      onLoginSuccess(data.token);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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

        {error && <Text color="red.500">{error}</Text>}

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

            <Button type="submit" colorScheme="purple" width="100%" mt={4} isLoading={loading}>
              Sign In
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default LoginPage;
