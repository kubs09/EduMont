import React from 'react';
import { Tabs as ChakraTabs } from '@chakra-ui/react';

export interface TabItem {
  label: string;
  content: React.ReactNode;
  id?: string;
}

interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  variant?: 'outline' | 'line' | 'subtle' | 'plain' | 'enclosed';
  colorScheme?: string;
  isLazy?: boolean;
  isFitted?: boolean;
}

const getTabValue = (tab: TabItem, index: number) => tab.id || String(index);

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultIndex = 0,
  onChange,
  variant = 'line',
  colorScheme = 'blue',
  isLazy = false,
  isFitted = false,
}) => {
  if (tabs.length === 0) {
    return null;
  }

  const resolvedDefaultIndex = tabs[defaultIndex] ? defaultIndex : 0;
  const defaultValue = getTabValue(tabs[resolvedDefaultIndex]!, resolvedDefaultIndex);

  return (
    <ChakraTabs.Root
      defaultValue={defaultValue}
      onValueChange={(details) => {
        const index = tabs.findIndex((tab, i) => getTabValue(tab, i) === details.value);
        onChange?.(index);
      }}
      variant={variant}
      colorPalette={colorScheme}
      lazyMount={isLazy}
      fitted={isFitted}
    >
      <ChakraTabs.List>
        {tabs.map((tab, index) => (
          <ChakraTabs.Trigger key={getTabValue(tab, index)} value={getTabValue(tab, index)}>
            {tab.label}
          </ChakraTabs.Trigger>
        ))}
      </ChakraTabs.List>

      {tabs.map((tab, index) => (
        <ChakraTabs.Content key={getTabValue(tab, index)} value={getTabValue(tab, index)}>
          {tab.content}
        </ChakraTabs.Content>
      ))}
    </ChakraTabs.Root>
  );
};

export default Tabs;
