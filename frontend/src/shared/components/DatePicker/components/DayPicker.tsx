import React from 'react';
import { VStack, Grid, GridItem, Button, Box, Text } from '@chakra-ui/react';
import { BaseDatePickerProps } from '@frontend/shared/components/DatePicker/utils/types';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
} from '@frontend/shared/components/DatePicker/utils/utils';
import DatePickerHeader from './DatePickerHeader';
import { texts } from '@frontend/texts';

interface DayPickerProps extends BaseDatePickerProps {
  displayYear: number;
  displayMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const DayPicker: React.FC<DayPickerProps> = ({
  value,
  onChange,
  language,
  onClose,
  displayYear,
  displayMonth,
  onYearChange,
  onMonthChange,
}) => {
  const handleDaySelect = (day: number) => {
    const monthStr = (displayMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    onChange(`${displayYear}-${monthStr}-${dayStr}`);
    onClose();
  };

  const renderDayPicker = () => {
    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDay = getFirstDayOfMonth(displayYear, displayMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <GridItem key={`empty-${i}`}>
          <Box />
        </GridItem>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const monthStr = (displayMonth + 1).toString().padStart(2, '0');
      const dateStr = `${displayYear}-${monthStr}-${dayStr}`;
      const isSelected = value === dateStr;

      days.push(
        <GridItem key={day}>
          <Button
            size="xs"
            variant="outline"
            width="100%"
            height="32px"
            minH="32px"
            onClick={() => handleDaySelect(day)}
            colorScheme={isSelected ? 'blue' : 'gray'}
            fontSize="sm"
          >
            {day}
          </Button>
        </GridItem>
      );
    }

    return days;
  };

  return (
    <VStack spacing={4}>
      <DatePickerHeader
        displayYear={displayYear}
        displayMonth={displayMonth}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        language={language}
        showMonth={true}
      />

      <Grid templateColumns="repeat(7, 1fr)" gap={1} width="100%" maxW="280px">
        {texts.datePicker.weekdays[language].map((day, index) => (
          <GridItem key={`header-${index}`}>
            <Text fontSize="xs" textAlign="center" fontWeight="bold" color="gray.500" mb={1}>
              {day}
            </Text>
          </GridItem>
        ))}
        {renderDayPicker()}
      </Grid>
    </VStack>
  );
};

export default DayPicker;
