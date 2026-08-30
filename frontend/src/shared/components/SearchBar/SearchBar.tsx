import React from 'react';
import { Input, InputGroup, IconButton, Icon } from '@chakra-ui/react';
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
    <InputGroup
      maxW="400px"
      startElement={<Icon as={FiSearch} color="text-muted" />}
      endElement={
        value ? (
          <IconButton aria-label="Clear search" size="xs" variant="ghost" onClick={handleClear}>
            <FiX />
          </IconButton>
        ) : undefined
      }
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        pr="2.5rem"
        mb={4}
      />
    </InputGroup>
  );
};

export default SearchBar;
