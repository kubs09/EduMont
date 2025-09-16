export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
};

export const getMondayOfWeek = (date: Date): Date => {
  const monday = new Date(date);
  const dayOfWeek = date.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else go to Monday
  monday.setDate(date.getDate() + daysToMonday);
  return monday;
};

export const getSundayOfWeek = (monday: Date): Date => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
};

export const formatWeekRange = (date: Date, language: 'cs' | 'en'): string => {
  const monday = getMondayOfWeek(date);
  const sunday = getSundayOfWeek(monday);

  const locale = language === 'cs' ? 'cs-CZ' : 'en-US';
  const startFormat = monday.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const endFormat = sunday.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startFormat} - ${endFormat}`;
};

export const formatDate = (date: Date, language: 'cs' | 'en'): string => {
  const locale = language === 'cs' ? 'cs-CZ' : 'en-US';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
