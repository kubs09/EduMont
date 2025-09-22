import React from 'react';
import { VStack, Grid, GridItem, Button, Box, Text } from '@chakra-ui/react';
import { BaseDatePickerProps } from '../utils/types';
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/utils';
import DatePickerHeader from './DatePickerHeader';

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

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <GridItem key={`empty-${i}`}>
          <Box />
        </GridItem>
      );
    }

    // Add days of the month
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
      {/* Month navigation for day picker */}
      <DatePickerHeader
        displayYear={displayYear}
        displayMonth={displayMonth}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        language={language}
        showMonth={true}
      />

      {/* Day grid */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1} width="100%" maxW="280px">
        {/* Day headers */}
        {(language === 'cs'
          ? ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        ).map((day, index) => (
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
