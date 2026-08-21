import { renderHook } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useAppToast } from './useAppToast';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe('useAppToast', () => {
  it('returns a callable toast function', () => {
    const { result } = renderHook(() => useAppToast(), { wrapper });
    expect(typeof result.current).toBe('function');
  });
});
