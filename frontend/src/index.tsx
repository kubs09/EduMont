import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

const AppComponent = (
  <ChakraProvider>
    <App />
  </ChakraProvider>
);

root.render(
  import.meta.env.DEV ? <React.StrictMode>{AppComponent}</React.StrictMode> : AppComponent
);
