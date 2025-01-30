import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import Routes from './Routes';
import { ROUTES } from './shared/route';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './shared/atoms/header/Header';

function App(): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));

  const handleLoginSuccess = (token: string) => {
    setIsAuthenticated(true);
    window.location.href = ROUTES.DASHBOARD;
  };

  return (
    <React.StrictMode>
      <ChakraProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Header />
            <Routes isAuthenticated={isAuthenticated} onLoginSuccess={handleLoginSuccess} />
          </BrowserRouter>
        </LanguageProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
}

export default App;
