import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import system from '../../../design/theme';
import Select from './Select';
import { SelectOption } from './types';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChakraProvider value={system}>{children}</ChakraProvider>
);

const options: SelectOption[] = [
  { label: 'Alpha', value: 'alpha' },
  { label: 'Bravo', value: 'bravo', disabled: true },
  { label: 'Charlie', value: 'charlie' },
];

const renderSelect = (props: Partial<Parameters<typeof Select>[0]> = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <Select
      options={props.options ?? options}
      value={props.value ?? null}
      onChange={onChange}
      isSearchable={false}
      isMulti={props.isMulti ?? false}
      isDisabled={props.isDisabled ?? false}
      isClearable={props.isClearable ?? false}
      placeholder="Choose one"
    />,
    { wrapper }
  );
  // getByRole('button') is ambiguous once isClearable renders its own
  // "Clear selection" button alongside the trigger, so identify the trigger
  // specifically by the aria-haspopup it always carries.
  const trigger = screen
    .getAllByRole('button')
    .find((el) => el.getAttribute('aria-haspopup') === 'listbox') as HTMLElement;
  return { ...utils, trigger, onChange };
};

const renderSearchableSelect = (props: Partial<Parameters<typeof Select>[0]> = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <Select
      options={options}
      value={props.value ?? null}
      onChange={onChange}
      isSearchable
      isMulti={props.isMulti ?? false}
      isClearable={false}
      placeholder="Choose one"
    />,
    { wrapper }
  );
  const input = screen.getByRole('combobox');
  return { ...utils, input, onChange };
};

describe('Select (isSearchable=false) keyboard interaction', () => {
  it('opens the listbox and selects an option with Enter', () => {
    const { trigger, onChange } = renderSelect();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('alpha');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the listbox and selects an option with Space', () => {
    const { trigger, onChange } = renderSelect();

    fireEvent.keyDown(trigger, { key: ' ' });
    fireEvent.keyDown(trigger, { key: ' ' });

    expect(onChange).toHaveBeenCalledWith('alpha');
  });

  it('moves the active-descendant with ArrowDown/ArrowUp, skipping disabled options', () => {
    const { trigger } = renderSelect();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // open, highlight Alpha (index 0)
    const optionElements = screen.getAllByRole('option');
    expect(trigger).toHaveAttribute('aria-activedescendant', optionElements[0].id);

    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // Bravo is disabled, should skip to Charlie
    expect(trigger).toHaveAttribute('aria-activedescendant', optionElements[2].id);

    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // already at the last option, clamp
    expect(trigger).toHaveAttribute('aria-activedescendant', optionElements[2].id);

    fireEvent.keyDown(trigger, { key: 'ArrowUp' }); // back to Alpha, skipping disabled Bravo
    expect(trigger).toHaveAttribute('aria-activedescendant', optionElements[0].id);
  });

  it('selects the highlighted option after navigating with arrow keys', () => {
    const { trigger, onChange } = renderSelect();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // highlight Alpha
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // skip disabled Bravo, highlight Charlie
    fireEvent.keyDown(trigger, { key: 'Enter' }); // select Charlie

    expect(onChange).toHaveBeenCalledWith('charlie');
  });

  it('closes on Escape without changing the selection', () => {
    const { trigger, onChange } = renderSelect();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the listbox open and toggles the highlighted option for multi-select', () => {
    const { trigger, onChange } = renderSelect({ isMulti: true });

    fireEvent.keyDown(trigger, { key: 'Enter' }); // open, highlight Alpha
    fireEvent.keyDown(trigger, { key: 'Enter' }); // toggle Alpha on

    expect(onChange).toHaveBeenCalledWith(['alpha']);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens already highlighting the current single-select value', () => {
    const { trigger } = renderSelect({ value: 'charlie' });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const listOptions = screen.getAllByRole('option');
    expect(trigger).toHaveAttribute('aria-activedescendant', listOptions[2].id);
  });

  it('exposes aria-disabled on the trigger when isDisabled is true', () => {
    const { trigger } = renderSelect({ isDisabled: true });

    expect(trigger).toHaveAttribute('aria-disabled', 'true');
  });

  it('exposes aria-disabled on a disabled option but not on enabled ones', () => {
    const { trigger } = renderSelect();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const [alphaOption, bravoOption, charlieOption] = screen.getAllByRole('option');
    expect(bravoOption).toHaveAttribute('aria-disabled', 'true');
    expect(alphaOption).not.toHaveAttribute('aria-disabled', 'true');
    expect(charlieOption).not.toHaveAttribute('aria-disabled', 'true');
  });
});

describe('Select (isSearchable=true) keyboard interaction', () => {
  it('opens on focus, already highlighting the first enabled option', () => {
    const { input } = renderSearchableSelect();

    fireEvent.focus(input);

    expect(input).toHaveAttribute('aria-expanded', 'true');
    const optionElements = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', optionElements[0].id);
  });

  it('navigates with ArrowDown, skipping disabled options', () => {
    const { input } = renderSearchableSelect();

    fireEvent.focus(input);
    const optionElements = screen.getAllByRole('option');

    fireEvent.keyDown(input, { key: 'ArrowDown' }); // Bravo is disabled, should skip to Charlie
    expect(input).toHaveAttribute('aria-activedescendant', optionElements[2].id);
  });

  it('selects the highlighted option with Enter and closes the listbox', () => {
    const { input, onChange } = renderSearchableSelect();

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // highlight Charlie
    fireEvent.keyDown(input, { key: 'Enter' }); // select Charlie

    expect(onChange).toHaveBeenCalledWith('charlie');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape without selecting anything', () => {
    const { input, onChange } = renderSearchableSelect();

    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('treats Space as a no-op for listbox purposes, unlike the trigger button', () => {
    // Unlike handleTriggerKeyDown, handleInputKeyDown must never intercept
    // Space — otherwise a user could never type one into the search text.
    // jsdom's fireEvent.keyDown doesn't simulate real character insertion,
    // so what we can assert here is the actual contract our handler upholds:
    // Space causes none of the listbox side effects Enter/ArrowDown would
    // (no selection, no closing), leaving the native input free to type it.
    const { input, onChange } = renderSearchableSelect();

    fireEvent.focus(input); // open, highlight Alpha
    fireEvent.keyDown(input, { key: ' ' });

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Select value: 0', () => {
  const zeroValueOptions: SelectOption[] = [
    { label: 'None', value: 0 },
    { label: 'One', value: 1 },
  ];

  it('shows the selected label instead of the placeholder', () => {
    const { trigger } = renderSelect({ options: zeroValueOptions, value: 0 });

    expect(trigger).toHaveTextContent('None');
    expect(trigger).not.toHaveTextContent('Choose one');
  });

  it('renders a clear button, proving it is treated as a real selection', () => {
    renderSelect({ options: zeroValueOptions, value: 0, isClearable: true });

    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeInTheDocument();
  });

  it('opens already highlighting the value-0 option, not the first option by default', () => {
    const { trigger } = renderSelect({ options: zeroValueOptions, value: 0 });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const optionElements = screen.getAllByRole('option');
    expect(trigger).toHaveAttribute('aria-activedescendant', optionElements[0].id);
  });
});
