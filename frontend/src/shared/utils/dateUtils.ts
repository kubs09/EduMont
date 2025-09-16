import { texts } from '../../texts';

export const formatMonthYear = (dateString: string, language: 'cs' | 'en'): string => {
  const date = new Date(dateString + '-01');
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  const monthName = texts.schedule.months[language][monthIndex];

  return `${monthName} ${year}`;
};

export const formatDateDisplay = (dateString: string, language: 'cs' | 'en'): string => {
  const date = new Date(dateString);

  if (language === 'cs') {
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } else {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
};

export const formatWeekDisplay = (dateString: string, language: 'cs' | 'en'): string => {
  const date = new Date(dateString);
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  if (language === 'cs') {
    const start = startOfWeek.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
    const end = endOfWeek.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  } else {
    const start = startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const end = endOfWeek.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  }
};
