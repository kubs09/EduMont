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
      options={options}
      value={props.value ?? null}
      onChange={onChange}
      isSearchable={false}
      isMulti={props.isMulti ?? false}
      isClearable={false}
      placeholder="Choose one"
    />,
    { wrapper }
  );
  const trigger = screen.getByRole('button');
  return { ...utils, trigger, onChange };
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
});
