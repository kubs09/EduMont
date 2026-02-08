import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  HStack,
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
  isMulti = false,
  isDisabled = false,
  isClearable = true,
  onInputChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<ComboboxOption[]>(options);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

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
    if (!value || (Array.isArray(value) && value.length === 0)) return '';
    if (Array.isArray(value)) {
      return options
        .filter((opt) => value.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
    }
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
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      const nextValues = currentValues.includes(selectedValue)
        ? currentValues.filter((val) => val !== selectedValue)
        : [...currentValues, selectedValue];
      onChange(nextValues);
      setInputValue('');
      return;
    }
    onChange(selectedValue);
    const selected = options.find((opt) => opt.value === selectedValue);
    setInputValue(selected?.label || '');
    onClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(isMulti ? [] : null);
    setInputValue('');
    inputRef.current?.focus();
  };

  const displayValue = getDisplayValue();
  const hasValue = Array.isArray(value) ? value.length > 0 : !!value;
  const selectedOptions = Array.isArray(value)
    ? options.filter((option) => value.includes(option.value))
    : [];

  return (
    <Box position="relative" width="100%" ref={containerRef}>
      <Box position="relative" ref={inputWrapperRef}>
        <InputGroup>
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={isMulti ? inputValue : inputValue || displayValue}
            onChange={handleInputChange}
            onFocus={onOpen}
            isDisabled={isDisabled}
            pr={isClearable && hasValue ? '2.5rem' : '2rem'}
            variant="outline"
          />
          {isClearable && hasValue && (
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
          {!isClearable || !hasValue ? (
            <InputRightElement pointerEvents="none">
              <ChevronDownIcon color="text-muted" />
            </InputRightElement>
          ) : null}
        </InputGroup>
      </Box>

      {isOpen && (
        <Portal containerRef={inputWrapperRef}>
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
                {filteredOptions.map((option) => {
                  const isSelected = Array.isArray(value)
                    ? value.includes(option.value)
                    : value === option.value;
                  return (
                    <Box
                      key={option.value}
                      p={2}
                      px={4}
                      cursor="pointer"
                      bg={isSelected ? 'brand.primary.500' : 'transparent'}
                      color={isSelected ? 'white' : 'text-primary'}
                      _hover={{
                        bg: isSelected ? 'brand.primary.500' : 'brand.primary.300',
                        _dark: {
                          bg: isSelected ? 'brand.primary.600' : 'whiteAlpha.100',
                        },
                      }}
                      _dark={{
                        color: isSelected ? 'white' : 'text-primary',
                      }}
                      onClick={() => handleSelectOption(option.value)}
                      transition="background-color 0.2s"
                    >
                      {option.label}
                    </Box>
                  );
                })}
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

      {isMulti && selectedOptions.length > 0 && (
        <VStack align="stretch" spacing={2} mt={3}>
          {selectedOptions.map((option) => (
            <HStack
              key={option.value}
              justify="space-between"
              borderWidth="1px"
              borderRadius="md"
              px={3}
              py={2}
            >
              <Text color="text-primary" fontSize="sm">
                {option.label}
              </Text>
              <IconButton
                aria-label="Remove selection"
                icon={<CloseIcon />}
                size="xs"
                variant="ghost"
                onClick={() => handleSelectOption(option.value)}
                isDisabled={isDisabled}
                color="text-muted"
                _hover={{ color: 'text-primary' }}
              />
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default Combobox;
