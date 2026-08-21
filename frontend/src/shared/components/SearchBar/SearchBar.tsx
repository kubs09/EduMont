import React from 'react';
import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { FiSearch, FiX } from 'react-icons/fi';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
}) => {
  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <InputGroup maxW="400px">
      <InputLeftElement pointerEvents="none">
        <Icon as={FiSearch} color="gray.400" />
      </InputLeftElement>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        pr="2.5rem"
        mb={4}
      />
      {value && (
        <InputRightElement>
          <IconButton
            aria-label="Clear search"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            onClick={handleClear}
          />
        </InputRightElement>
      )}
    </InputGroup>
  );
};

export default SearchBar;
