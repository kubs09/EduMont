import React from 'react';
import {
  HStack,
  IconButton,
  useDisclosure,
  Popover,
  VStack,
  Button,
  Grid,
  GridItem,
  Icon,
} from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi';
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
  const { open: isYearOpen, onOpen: onYearOpen, onClose: onYearClose } = useDisclosure();
  const { open: isMonthOpen, onOpen: onMonthOpen, onClose: onMonthClose } = useDisclosure();

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
    // eslint-disable-next-line jsx-a11y-x/no-static-element-interactions, jsx-a11y-x/click-events-have-key-events -- stops click propagation only, not a real interactive element
    <div onClick={(e) => e.stopPropagation()}>
      <HStack justify="space-between" width="100%" gap={2}>
        <IconButton
          aria-label={
            showMonth
              ? texts.common.datePicker.previousMonth[language]
              : texts.common.datePicker.previousYear[language]
          }
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (showMonth) {
              handlePrevMonth();
            } else {
              handlePrevYear();
            }
          }}
          variant="ghost"
        >
          <FiChevronLeft />
        </IconButton>

        <HStack gap={1} flex={1} justify="center">
          {showMonth && displayMonth !== undefined && (
            <Popover.Root
              open={isMonthOpen}
              closeOnInteractOutside={false}
              onOpenChange={(e) => {
                if (!e.open) {
                  onMonthClose();
                }
              }}
              positioning={{
                placement: 'bottom',
                strategy: 'fixed',
              }}
            >
              <Popover.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMonthOpen();
                  }}
                  fontSize="md"
                  fontWeight="bold"
                  _hover={{ bg: 'gray.100' }}
                >
                  {texts.common.datePicker.months[language][displayMonth]}
                  <Icon as={FiChevronDown} boxSize={3} />
                </Button>
              </Popover.Trigger>
              <Popover.Positioner>
                <Popover.Content width="200px">
                  <Popover.Body p={2}>
                    <Grid templateColumns="repeat(1, 1fr)" gap={1}>
                      {texts.common.datePicker.months[language].map((month, index) => (
                        <GridItem key={index}>
                          <Button
                            size="sm"
                            variant="ghost"
                            width="100%"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMonthSelect(index);
                            }}
                            bg={displayMonth === index ? 'bg-brand-subtle' : 'transparent'}
                            color={displayMonth === index ? 'fg-brand' : 'inherit'}
                            _hover={{ bg: displayMonth === index ? 'bg-brand-subtle' : 'gray.100' }}
                            justifyContent="flex-start"
                          >
                            {month}
                          </Button>
                        </GridItem>
                      ))}
                    </Grid>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Root>
          )}

          <Popover.Root
            open={isYearOpen}
            closeOnInteractOutside={false}
            onOpenChange={(e) => {
              if (!e.open) {
                onYearClose();
              }
            }}
            positioning={{
              placement: 'bottom',
              strategy: 'fixed',
            }}
          >
            <Popover.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onYearOpen();
                }}
                fontSize="md"
                fontWeight="bold"
                _hover={{ bg: 'gray.100' }}
              >
                {displayYear}
                <Icon as={FiChevronDown} boxSize={3} />
              </Button>
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content width="180px" maxH="250px" overflowY="auto">
                <Popover.Body p={2}>
                  <VStack gap={1} align="stretch">
                    {yearRange.map((year) => (
                      <Button
                        key={year}
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleYearSelect(year);
                        }}
                        bg={displayYear === year ? 'bg-brand-subtle' : 'transparent'}
                        color={displayYear === year ? 'fg-brand' : 'inherit'}
                        _hover={{ bg: displayYear === year ? 'bg-brand-subtle' : 'gray.100' }}
                        justifyContent="flex-start"
                      >
                        {year}
                      </Button>
                    ))}
                  </VStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
        </HStack>

        <IconButton
          aria-label={
            showMonth
              ? texts.common.datePicker.nextMonth[language]
              : texts.common.datePicker.nextYear[language]
          }
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (showMonth) {
              handleNextMonth();
            } else {
              handleNextYear();
            }
          }}
          variant="ghost"
        >
          <FiChevronRight />
        </IconButton>
      </HStack>
    </div>
  );
};

export default DatePickerHeader;
