export interface ComboboxOption {
  label: string;
  value: string | number;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | number | Array<string | number> | null;
  onChange: (value: string | number | Array<string | number> | null) => void;
  placeholder?: string;
  isMulti?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  onInputChange?: (inputValue: string) => void;
}
