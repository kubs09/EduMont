import React, { useState } from 'react';
import { Input, InputGroup, Button, HStack, Popover, IconButton } from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';
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
      return `${texts.common.datePicker.months[language][monthIndex]} ${year}`;
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
    <Popover.Root open={isOpen} closeOnInteractOutside={false} onOpenChange={e => {
      if (!e.open) {
        onClose();
      }
    }}>
      <InputGroup
        maxW="200px"
        endElement={
          <Popover.Trigger asChild>
            <IconButton
              aria-label={texts.common.datePicker.openPicker[language]}
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
            >
              <FiCalendar />
            </IconButton>
          </Popover.Trigger>
        }
      >
        <Input
          value={getDisplayValue()}
          readOnly
          placeholder={
            viewType === 'month'
              ? texts.common.datePicker.selectMonth[language]
              : texts.common.datePicker.selectDate[language]
          }
        />
      </InputGroup>
      <Popover.Positioner>
        <Popover.Content width="320px">
          <Popover.Body p={3}>
            {renderPicker()}

            <HStack gap={2} width="100%" mt={4}>
              <Button size="sm" variant="outline" onClick={handleClear} flex={1}>
                {texts.common.datePicker.clear[language]}
              </Button>
              <Button size="sm" variant="outline" onClick={handleToday} flex={1}>
                {viewType === 'month'
                  ? texts.common.datePicker.thisMonth[language]
                  : texts.common.datePicker.today[language]}
              </Button>
            </HStack>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};

export default DatePicker;
