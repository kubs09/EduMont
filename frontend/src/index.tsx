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
  process.env.NODE_ENV === 'development' ? (
    <React.StrictMode>{AppComponent}</React.StrictMode>
  ) : (
    AppComponent
  )
);
