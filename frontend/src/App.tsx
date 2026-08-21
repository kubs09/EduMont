import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import system from './design/theme';
import { Toaster } from './components/ui/toaster';
import Routes from './Routes';
import { ROUTES } from './shared/route';
import { LanguageProvider } from './shared/contexts/LanguageContext';
import Header from './shared/atoms/header/Header';
import Footer from './shared/atoms/footer/Footer';
import { SnackbarProvider } from 'notistack';

function App(): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    window.location.href = ROUTES.DASHBOARD;
  };

  return (
    <React.StrictMode>

      <ChakraProvider value={system}>
        <LanguageProvider>
          <SnackbarProvider maxSnack={3}>
            <BrowserRouter>
              <Header />
              <Routes isAuthenticated={isAuthenticated} onLoginSuccess={handleLoginSuccess} />
              <Footer />
            </BrowserRouter>
          </SnackbarProvider>
        </LanguageProvider>
        <Toaster />
      </ChakraProvider>
    </React.StrictMode>
  );
}

export default App;
