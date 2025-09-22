import { texts } from '@frontend/texts';

export const formatMonthYear = (dateString: string, language: 'cs' | 'en'): string => {
  const date = new Date(dateString + '-01');
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  const monthName = texts.datePicker.months[language][monthIndex];

  return `${monthName} ${year}`;
};

export const formatDateDisplay = (dateString: string, language: 'cs' | 'en'): string => {
  const date = new Date(dateString);

  const locale = language === 'cs' ? 'cs-CZ' : 'en-US';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatWeekDisplay = (dateString: string, language: 'cs' | 'en'): string => {
  const date = new Date(dateString);
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const locale = language === 'cs' ? 'cs-CZ' : 'en-US';
  const start = startOfWeek.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const end = endOfWeek.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${start} - ${end}`;
};
