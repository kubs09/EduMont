import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  FormErrorMessage,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { UseFormRegisterReturn } from 'react-hook-form';

interface PasswordInputProps {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  registration,
  onFocus,
  onBlur,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FormControl isRequired isInvalid={!!error}>
      <FormLabel fontSize={{ base: 'xs', md: 'sm' }}>{label}</FormLabel>
      <InputGroup>
        <Input
          type={showPassword ? 'text' : 'password'}
          {...registration}
          size="sm"
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <InputRightElement h="full">
          <IconButton
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
            onClick={() => setShowPassword(!showPassword)}
            variant="ghost"
          />
        </InputRightElement>
      </InputGroup>
      <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>
    </FormControl>
  );
};
