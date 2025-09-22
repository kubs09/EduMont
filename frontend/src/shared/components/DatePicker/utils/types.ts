export interface BaseDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  language: 'cs' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export interface DatePickerDisplayProps {
  value: string;
  language: 'cs' | 'en';
  placeholder: string;
}

export type ViewType = 'day' | 'week' | 'month';

export interface CustomDatePickerProps {
  viewType: ViewType;
  value: string;
  onChange: (value: string) => void;
  language: 'cs' | 'en';
}
