import React from 'react';
import { VStack, HStack, Text, Grid, GridItem, IconButton, Button, Box } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { texts } from '../../../../texts';
import { BaseDatePickerProps } from '../utils/types';
import { getDaysInMonth, getFirstDayOfMonth, getMondayOfWeek } from '../utils/utils';

interface WeekPickerProps extends BaseDatePickerProps {
  displayYear: number;
  displayMonth: number;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

const WeekPicker: React.FC<WeekPickerProps> = ({
  value,
  onChange,
  language,
  onClose,
  displayYear,
  displayMonth,
  onMonthChange,
}) => {
  const handleWeekSelect = (day: number) => {
    const monthStr = (displayMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const selectedDate = new Date(`${displayYear}-${monthStr}-${dayStr}`);

    const monday = getMondayOfWeek(selectedDate);
    onChange(monday.toISOString().split('T')[0]);
    onClose();
  };

  const renderWeekPicker = () => {
    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDay = getFirstDayOfMonth(displayYear, displayMonth);
    const weeks = [];
    let currentWeek = [];

    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(
        <GridItem key={`empty-${i}`}>
          <Box />
        </GridItem>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const monthStr = (displayMonth + 1).toString().padStart(2, '0');
      const dateStr = `${displayYear}-${monthStr}-${dayStr}`;
      const currentDate = new Date(dateStr);

      const monday = getMondayOfWeek(currentDate);
      const mondayStr = monday.toISOString().split('T')[0];

      const isSelectedWeek =
        value &&
        (() => {
          const selectedDate = new Date(value);
          const selectedMonday = getMondayOfWeek(selectedDate);
          return selectedMonday.toISOString().split('T')[0] === mondayStr;
        })();

      currentWeek.push(
        <GridItem key={day}>
          <Button
            size="xs"
            variant="outline"
            width="100%"
            height="32px"
            minH="32px"
            onClick={() => handleWeekSelect(day)}
            colorScheme={isSelectedWeek ? 'blue' : 'gray'}
            bg={isSelectedWeek ? 'blue.50' : 'transparent'}
            fontSize="sm"
          >
            {day}
          </Button>
        </GridItem>
      );

      if (currentWeek.length === 7) {
        weeks.push(<React.Fragment key={`week-${weeks.length}`}>{currentWeek}</React.Fragment>);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(
          <GridItem key={`empty-end-${currentWeek.length}`}>
            <Box />
          </GridItem>
        );
      }
      weeks.push(<React.Fragment key={`week-${weeks.length}`}>{currentWeek}</React.Fragment>);
    }

    return weeks;
  };

  return (
    <VStack spacing={4}>
      <HStack justify="space-between" width="100%">
        <IconButton
          aria-label="Previous month"
          icon={<ChevronLeftIcon />}
          size="sm"
          onClick={() => onMonthChange('prev')}
        />
        <Text fontSize="lg" fontWeight="bold">
          {texts.schedule.months[language][displayMonth]} {displayYear}
        </Text>
        <IconButton
          aria-label="Next month"
          icon={<ChevronRightIcon />}
          size="sm"
          onClick={() => onMonthChange('next')}
        />
      </HStack>

      <Text fontSize="sm" color="gray.600" textAlign="center">
        {language === 'cs'
          ? 'Klikněte na libovolný den pro výběr týdne'
          : 'Click any day to select that week'}
      </Text>

      <Grid templateColumns="repeat(7, 1fr)" gap={1} width="100%" maxW="280px">
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
        {renderWeekPicker()}
      </Grid>
    </VStack>
  );
};

export default WeekPicker;
