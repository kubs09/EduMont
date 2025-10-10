import React, { useState } from 'react';
import {
  Input,
  InputGroup,
  InputRightElement,
  Button,
  HStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  IconButton,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { texts } from '@frontend/texts';
import { CustomDatePickerProps } from '@frontend/shared/components/DatePicker/utils/types';
import { formatWeekRange, formatDate } from '@frontend/shared/components/DatePicker/utils/utils';
import DayPicker from './DayPicker';
import WeekPicker from './WeekPicker';
import MonthPicker from './MonthPicker';

const DatePicker: React.FC<CustomDatePickerProps> = ({ viewType, value, onChange, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth());

  const getDisplayValue = () => {
    if (!value) return '';

    if (viewType === 'month') {
      const [year, month] = value.substring(0, 7).split('-');
      const monthIndex = parseInt(month) - 1;
      return `${texts.datePicker.months[language][monthIndex]} ${year}`;
    } else if (viewType === 'week') {
      const date = new Date(value);
      return formatWeekRange(date, language);
    } else {
      const date = new Date(value);
      return formatDate(date, language);
    }
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    if (viewType === 'month') {
      onChange(today.toISOString().substring(0, 7) + '-01');
    } else {
      onChange(today.toISOString().split('T')[0]);
    }
    setIsOpen(false);
  };

  const handleYearChange = (year: number) => {
    setDisplayYear(year);
  };

  const handleMonthChange = (month: number) => {
    setDisplayMonth(month);
  };

  const onClose = () => setIsOpen(false);

  const renderPicker = () => {
    const baseProps = {
      value,
      onChange,
      language,
      isOpen,
      onClose,
    };

    switch (viewType) {
      case 'day':
        return (
          <DayPicker
            {...baseProps}
            displayYear={displayYear}
            displayMonth={displayMonth}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
          />
        );
      case 'week':
        return (
          <WeekPicker
            {...baseProps}
            displayYear={displayYear}
            displayMonth={displayMonth}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
          />
        );
      case 'month':
        return (
          <MonthPicker {...baseProps} displayYear={displayYear} onYearChange={handleYearChange} />
        );
      default:
        return null;
    }
  };

  return (
    <Popover isOpen={isOpen} onClose={onClose} closeOnBlur={false}>
      <InputGroup maxW="200px">
        <Input
          value={getDisplayValue()}
          readOnly
          placeholder={
            viewType === 'month'
              ? texts.datePicker.selectMonth[language]
              : texts.datePicker.selectDate[language]
          }
        />
        <InputRightElement>
          <PopoverTrigger>
            <IconButton
              aria-label={texts.datePicker.openPicker[language]}
              icon={<CalendarIcon />}
              size="sm"
              variant="ghost"
              color="gray.500"
              onClick={() => setIsOpen(!isOpen)}
            />
          </PopoverTrigger>
        </InputRightElement>
      </InputGroup>
      <PopoverContent width="320px">
        <PopoverBody p={3}>
          {renderPicker()}

          <HStack spacing={2} width="100%" mt={4}>
            <Button size="sm" variant="outline" onClick={handleClear} flex={1}>
              {texts.datePicker.clear[language]}
            </Button>
            <Button size="sm" variant="outline" onClick={handleToday} flex={1}>
              {viewType === 'month'
                ? texts.datePicker.thisMonth[language]
                : texts.datePicker.today[language]}
            </Button>
          </HStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
