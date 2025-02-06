import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import theme from './design/theme';
import Routes from './Routes';
import { ROUTES } from './shared/route';
import { LanguageProvider } from './shared/contexts/LanguageContext';
import Header from './shared/atoms/header/Header';
import Footer from './shared/atoms/footer/Footer';
import { SnackbarProvider } from 'notistack';

function App(): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));

  const handleLoginSuccess = (token: string) => {
    setIsAuthenticated(true);
    window.location.href = ROUTES.DASHBOARD;
  };

  return (
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <LanguageProvider>
          <SnackbarProvider maxSnack={3}>
            <BrowserRouter>
              <Header />
              <Routes isAuthenticated={isAuthenticated} onLoginSuccess={handleLoginSuccess} />
              <Footer />
            </BrowserRouter>
          </SnackbarProvider>
        </LanguageProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
}

export default App;
