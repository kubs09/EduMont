import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  HStack,
  useDisclosure,
  InputGroup,
  IconButton,
  Portal,
  Icon,
} from '@chakra-ui/react';
import { FiX, FiChevronDown } from 'react-icons/fi';
import { useOutsideClick } from '@frontend/shared/hooks/useOutsideClick';
import { SelectProps, SelectOption } from './types';

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  isMulti = false,
  isSearchable = true,
  isDisabled = false,
  isClearable = true,
  onInputChange,
  width = '100%',
  minWidth = '280px',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>(options);
  const { open, onOpen, onClose } = useDisclosure();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  useOutsideClick({
    ref: containerRef,
    handler: onClose,
  });

  useEffect(() => {
    if (!isSearchable) {
      setFilteredOptions(options);
      return;
    }
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options, isSearchable]);

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
    if (!open) {
      onOpen();
    }
  };

  const handleTriggerClick = () => {
    if (isDisabled) return;
    if (open) {
      onClose();
    } else {
      onOpen();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTriggerClick();
    }
  };

  const handleSelectOption = (option: SelectOption) => {
    if (option.disabled) return;
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      const nextValues = currentValues.includes(option.value)
        ? currentValues.filter((val) => val !== option.value)
        : [...currentValues, option.value];
      onChange(nextValues);
      setInputValue('');
      return;
    }
    onChange(option.value);
    setInputValue(option.label);
    onClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(isMulti ? [] : null);
    setInputValue('');
    if (isSearchable) {
      inputRef.current?.focus();
    }
  };

  const displayValue = getDisplayValue();
  const hasValue = Array.isArray(value) ? value.length > 0 : !!value;
  const selectedOptions = Array.isArray(value)
    ? options.filter((option) => value.includes(option.value))
    : [];

  const endElement =
    isClearable && hasValue ? (
      <IconButton
        aria-label="Clear selection"
        size="sm"
        variant="ghost"
        onClick={handleClear}
        disabled={isDisabled}
        color="text-muted"
        _hover={{ color: 'text-primary' }}
      >
        <FiX />
      </IconButton>
    ) : (
      <Icon as={FiChevronDown} color="text-muted" />
    );

  return (
    <Box position="relative" width={width} minWidth={minWidth} ref={containerRef}>
      <Box position="relative" ref={inputWrapperRef}>
        {isSearchable ? (
          <InputGroup endElement={endElement}>
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={isMulti ? inputValue : inputValue || displayValue}
              onChange={handleInputChange}
              onFocus={onOpen}
              disabled={isDisabled}
              pr={isClearable && hasValue ? '2.5rem' : '2rem'}
              variant="outline"
            />
          </InputGroup>
        ) : (
          <Box position="relative">
            <Box
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={handleTriggerClick}
              onKeyDown={handleTriggerKeyDown}
              width="100%"
              bg="bg-surface"
              borderWidth="1px"
              borderColor="border-color"
              borderRadius="md"
              color={hasValue ? 'text-primary' : 'text-muted'}
              px={3}
              py={2}
              pr={isClearable && hasValue ? '2.5rem' : '2rem'}
              cursor={isDisabled ? 'not-allowed' : 'pointer'}
              opacity={isDisabled ? 0.5 : 1}
              _focus={{
                borderColor: 'brand.primary.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary-500)',
                outline: 'none',
              }}
            >
              {displayValue || placeholder}
            </Box>
            <Box
              position="absolute"
              right={3}
              top="50%"
              transform="translateY(-50%)"
              pointerEvents={isClearable && hasValue ? 'auto' : 'none'}
            >
              {endElement}
            </Box>
          </Box>
        )}
      </Box>

      {open && (
        <Portal container={inputWrapperRef}>
          <Box
            role="listbox"
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
              <VStack gap={0} align="stretch">
                {filteredOptions.map((option) => {
                  const isSelected = Array.isArray(value)
                    ? value.includes(option.value)
                    : value === option.value;
                  return (
                    <Box
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      p={2}
                      px={4}
                      cursor={option.disabled ? 'not-allowed' : 'pointer'}
                      opacity={option.disabled ? 0.5 : 1}
                      bg={isSelected ? 'brand.primary.500' : 'transparent'}
                      color={isSelected ? 'white' : 'text-primary'}
                      _hover={
                        option.disabled
                          ? undefined
                          : {
                              bg: isSelected ? 'brand.primary.500' : 'brand.primary.300',
                              _dark: {
                                bg: isSelected ? 'brand.primary.600' : 'whiteAlpha.100',
                              },
                            }
                      }
                      _dark={{
                        color: isSelected ? 'white' : 'text-primary',
                      }}
                      onClick={() => handleSelectOption(option)}
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
        <VStack align="stretch" gap={2} mt={3}>
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
                size="xs"
                variant="ghost"
                onClick={() => handleSelectOption(option)}
                disabled={isDisabled}
                color="text-muted"
                _hover={{ color: 'text-primary' }}
              >
                <FiX />
              </IconButton>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default Select;
