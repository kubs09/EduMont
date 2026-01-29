import React from 'react';
import { Tabs as ChakraTabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';

export interface TabItem {
  label: string;
  content: React.ReactNode;
  id?: string;
}

interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  variant?: 'line' | 'enclosed' | 'enclosed-colored' | 'soft-rounded' | 'solid-rounded';
  colorScheme?: string;
  isLazy?: boolean;
  isFitted?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultIndex = 0,
  onChange,
  variant = 'line',
  colorScheme = 'blue',
  isLazy = false,
  isFitted = false,
}) => {
  return (
    <ChakraTabs
      defaultIndex={defaultIndex}
      onChange={onChange}
      variant={variant}
      colorScheme={colorScheme}
      isLazy={isLazy}
      isFitted={isFitted}
    >
      <TabList>
        {tabs.map((tab, index) => (
          <Tab key={tab.id || index}>{tab.label}</Tab>
        ))}
      </TabList>

      <TabPanels>
        {tabs.map((tab, index) => (
          <TabPanel key={tab.id || index}>{tab.content}</TabPanel>
        ))}
      </TabPanels>
    </ChakraTabs>
  );
};

export default Tabs;
