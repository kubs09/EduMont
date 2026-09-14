export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string | number | Array<string | number> | null;
  onChange: (value: string | number | Array<string | number> | null) => void;
  placeholder?: string;
  isMulti?: boolean;
  isSearchable?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  onInputChange?: (inputValue: string) => void;
  width?: string;
  minWidth?: string;
}
