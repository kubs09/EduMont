import React from 'react';
import {
  HStack,
  IconButton,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
  Button,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { texts } from '@frontend/texts';

interface DatePickerHeaderProps {
  displayYear: number;
  displayMonth?: number;
  onYearChange: (year: number) => void;
  onMonthChange?: (month: number) => void;
  language: 'cs' | 'en';
  showMonth?: boolean;
}

const DatePickerHeader: React.FC<DatePickerHeaderProps> = ({
  displayYear,
  displayMonth,
  onYearChange,
  onMonthChange,
  language,
  showMonth = true,
}) => {
  const { isOpen: isYearOpen, onOpen: onYearOpen, onClose: onYearClose } = useDisclosure();
  const { isOpen: isMonthOpen, onOpen: onMonthOpen, onClose: onMonthClose } = useDisclosure();

  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    onYearClose();
  };

  const handleMonthSelect = (monthIndex: number) => {
    if (onMonthChange) {
      onMonthChange(monthIndex);
    }
    onMonthClose();
  };

  const handlePrevYear = () => {
    onYearChange(displayYear - 1);
  };

  const handleNextYear = () => {
    onYearChange(displayYear + 1);
  };

  const handlePrevMonth = () => {
    if (onMonthChange && displayMonth !== undefined) {
      if (displayMonth === 0) {
        onMonthChange(11);
        onYearChange(displayYear - 1);
      } else {
        onMonthChange(displayMonth - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (onMonthChange && displayMonth !== undefined) {
      if (displayMonth === 11) {
        onMonthChange(0);
        onYearChange(displayYear + 1);
      } else {
        onMonthChange(displayMonth + 1);
      }
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <HStack justify="space-between" width="100%" spacing={2}>
        <IconButton
          aria-label={
            showMonth
              ? texts.datePicker.previousMonth[language]
              : texts.datePicker.previousYear[language]
          }
          icon={<ChevronLeftIcon />}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            showMonth ? handlePrevMonth() : handlePrevYear();
          }}
          variant="ghost"
        />

        <HStack spacing={1} flex={1} justify="center">
          {showMonth && displayMonth !== undefined && (
            <Popover
              isOpen={isMonthOpen}
              onClose={onMonthClose}
              placement="bottom"
              strategy="fixed"
              closeOnBlur={false}
            >
              <PopoverTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ChevronDownIcon boxSize={3} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMonthOpen();
                  }}
                  fontSize="md"
                  fontWeight="bold"
                  _hover={{ bg: 'gray.100' }}
                >
                  {texts.datePicker.months[language][displayMonth]}
                </Button>
              </PopoverTrigger>
              <PopoverContent width="200px">
                <PopoverBody p={2}>
                  <Grid templateColumns="repeat(1, 1fr)" gap={1}>
                    {texts.datePicker.months[language].map((month, index) => (
                      <GridItem key={index}>
                        <Button
                          size="sm"
                          variant="ghost"
                          width="100%"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMonthSelect(index);
                          }}
                          bg={displayMonth === index ? 'blue.50' : 'transparent'}
                          color={displayMonth === index ? 'blue.600' : 'inherit'}
                          _hover={{ bg: displayMonth === index ? 'blue.100' : 'gray.100' }}
                          justifyContent="flex-start"
                        >
                          {month}
                        </Button>
                      </GridItem>
                    ))}
                  </Grid>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}

          <Popover
            isOpen={isYearOpen}
            onClose={onYearClose}
            placement="bottom"
            strategy="fixed"
            closeOnBlur={false}
          >
            <PopoverTrigger>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ChevronDownIcon boxSize={3} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onYearOpen();
                }}
                fontSize="md"
                fontWeight="bold"
                _hover={{ bg: 'gray.100' }}
              >
                {displayYear}
              </Button>
            </PopoverTrigger>
            <PopoverContent width="180px" maxH="250px" overflowY="auto">
              <PopoverBody p={2}>
                <VStack spacing={1} align="stretch">
                  {yearRange.map((year) => (
                    <Button
                      key={year}
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleYearSelect(year);
                      }}
                      bg={displayYear === year ? 'blue.50' : 'transparent'}
                      color={displayYear === year ? 'blue.600' : 'inherit'}
                      _hover={{ bg: displayYear === year ? 'blue.100' : 'gray.100' }}
                      justifyContent="flex-start"
                    >
                      {year}
                    </Button>
                  ))}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>

        <IconButton
          aria-label={
            showMonth ? texts.datePicker.nextMonth[language] : texts.datePicker.nextYear[language]
          }
          icon={<ChevronRightIcon />}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            showMonth ? handleNextMonth() : handleNextYear();
          }}
          variant="ghost"
        />
      </HStack>
    </div>
  );
};

export default DatePickerHeader;
