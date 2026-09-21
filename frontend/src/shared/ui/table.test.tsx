import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import system from '../../design/theme';
import { CustomTable } from './table';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChakraProvider value={system}>{children}</ChakraProvider>
);

describe('CustomTable', () => {
  it('renders headers and row data', () => {
    render(
      <CustomTable
        headers={['Name', 'Email']}
        data={[
          ['Jana Novak', 'jana@example.com'],
          ['Petr Svoboda', 'petr@example.com'],
        ]}
      />,
      { wrapper }
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByText('Jana Novak')).toBeInTheDocument();
    expect(screen.getByText('petr@example.com')).toBeInTheDocument();
  });

  it('renders an actions cell per row when actions is provided', () => {
    const actions = vi.fn((rowIndex: number) => <button>Delete row {rowIndex}</button>);
    render(
      <CustomTable
        headers={['Name']}
        data={[['Jana Novak'], ['Petr Svoboda']]}
        actions={actions}
      />,
      { wrapper }
    );

    expect(screen.getByRole('button', { name: 'Delete row 0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete row 1' })).toBeInTheDocument();
    expect(actions).toHaveBeenCalledTimes(2);
  });
});
