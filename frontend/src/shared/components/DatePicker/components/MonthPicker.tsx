import React from 'react';
import { VStack, Grid, GridItem, Button } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { BaseDatePickerProps } from '@frontend/shared/components/DatePicker/utils/types';
import DatePickerHeader from './DatePickerHeader';

interface MonthPickerProps extends BaseDatePickerProps {
  displayYear: number;
  onYearChange: (year: number) => void;
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
      <DatePickerHeader
        displayYear={displayYear}
        onYearChange={onYearChange}
        language={language}
        showMonth={false}
      />

      <Grid templateColumns="repeat(3, 1fr)" gap={2} width="100%">
        {texts.datePicker.months[language].map((month, index) => (
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
