import React from 'react';
import { VStack, HStack, Text, Grid, GridItem, IconButton, Button } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { texts } from '../../../../texts';
import { BaseDatePickerProps } from '../utils/types';

interface MonthPickerProps extends BaseDatePickerProps {
  displayYear: number;
  onYearChange: (direction: 'prev' | 'next') => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  language,
  onClose,
  displayYear,
  onYearChange,
}) => {
  const handleMonthSelect = (monthIndex: number) => {
    const monthStr = (monthIndex + 1).toString().padStart(2, '0');
    onChange(`${displayYear}-${monthStr}-01`);
    onClose();
  };

  return (
    <VStack spacing={4}>
      {/* Year navigation for month picker */}
      <HStack justify="space-between" width="100%">
        <IconButton
          aria-label="Previous year"
          icon={<ChevronLeftIcon />}
          size="sm"
          onClick={() => onYearChange('prev')}
        />
        <Text fontSize="lg" fontWeight="bold">
          {displayYear}
        </Text>
        <IconButton
          aria-label="Next year"
          icon={<ChevronRightIcon />}
          size="sm"
          onClick={() => onYearChange('next')}
        />
      </HStack>

      {/* Month grid */}
      <Grid templateColumns="repeat(3, 1fr)" gap={2} width="100%">
        {texts.schedule.months[language].map((month, index) => (
          <GridItem key={index}>
            <Button
              size="sm"
              variant="outline"
              width="100%"
              onClick={() => handleMonthSelect(index)}
              colorScheme={
                value.substring(0, 7) ===
                `${displayYear}-${(index + 1).toString().padStart(2, '0')}`
                  ? 'blue'
                  : 'gray'
              }
            >
              {month}
            </Button>
          </GridItem>
        ))}
      </Grid>
    </VStack>
  );
};

export default MonthPicker;
