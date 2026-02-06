import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  useDisclosure,
  InputGroup,
  InputRightElement,
  IconButton,
  Portal,
  useOutsideClick,
} from '@chakra-ui/react';
import { CloseIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { ComboboxProps, ComboboxOption } from './types';

const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  isDisabled = false,
  isClearable = true,
  onInputChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<ComboboxOption[]>(options);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClick({
    ref: containerRef,
    handler: onClose,
  });

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  const getDisplayValue = () => {
    if (!value) return '';
    const selected = options.find((opt) => opt.value === value);
    return selected?.label || '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onInputChange) {
      onInputChange(newValue);
    }
    if (!isOpen) {
      onOpen();
    }
  };

  const handleSelectOption = (selectedValue: string | number) => {
    onChange(selectedValue);
    const selected = options.find((opt) => opt.value === selectedValue);
    setInputValue(selected?.label || '');
    onClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setInputValue('');
    inputRef.current?.focus();
  };

  const displayValue = value ? getDisplayValue() : '';

  return (
    <Box position="relative" width="100%" ref={containerRef}>
      <InputGroup>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue || displayValue}
          onChange={handleInputChange}
          onFocus={onOpen}
          isDisabled={isDisabled}
          pr={isClearable && value ? '2.5rem' : '2rem'}
          variant="outline"
        />
        {isClearable && value && (
          <InputRightElement width="2.5rem">
            <IconButton
              aria-label="Clear selection"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              onClick={handleClear}
              isDisabled={isDisabled}
              color="text-muted"
              _hover={{ color: 'text-primary' }}
            />
          </InputRightElement>
        )}
        {!isClearable || !value ? (
          <InputRightElement pointerEvents="none">
            <ChevronDownIcon color="text-muted" />
          </InputRightElement>
        ) : null}
      </InputGroup>

      {isOpen && (
        <Portal containerRef={containerRef}>
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            mt={1}
            bg="bg-surface"
            border="1px solid"
            borderColor="border-color"
            borderRadius="md"
            boxShadow="lg"
            maxH="300px"
            overflowY="auto"
            zIndex={10}
          >
            {filteredOptions.length > 0 ? (
              <VStack spacing={0} align="stretch">
                {filteredOptions.map((option) => (
                  <Box
                    key={option.value}
                    p={2}
                    px={4}
                    cursor="pointer"
                    bg={value === option.value ? 'brand.primary.500' : 'transparent'}
                    color={value === option.value ? 'white' : 'text-primary'}
                    _hover={{
                      bg: value === option.value ? 'brand.primary.500' : 'brand.primary.300',
                      _dark: {
                        bg: value === option.value ? 'brand.primary.600' : 'whiteAlpha.100',
                      },
                    }}
                    _dark={{
                      color: value === option.value ? 'white' : 'text-primary',
                    }}
                    onClick={() => handleSelectOption(option.value)}
                    transition="background-color 0.2s"
                  >
                    {option.label}
                  </Box>
                ))}
              </VStack>
            ) : (
              <Box p={4}>
                <Text color="text-muted" fontSize="sm">
                  No options found
                </Text>
              </Box>
            )}
          </Box>
        </Portal>
      )}
    </Box>
  );
};

export default Combobox;
