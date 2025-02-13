import { Navigate, useLocation } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import theme from './design/theme';
import Routes from './Routes';
import { ROUTES } from './shared/route';
import { LanguageProvider } from './shared/contexts/LanguageContext';
import Header from './shared/atoms/header/Header';
import Footer from './shared/atoms/footer/Footer';
import { SnackbarProvider } from 'notistack';

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));
  const location = useLocation();
  const userRole = localStorage.getItem('userRole');
  const admissionStatus = localStorage.getItem('admissionStatus');

  const handleLoginSuccess = (token: string) => {
    setIsAuthenticated(true);
    window.location.href = ROUTES.DASHBOARD;
  };

  const shouldRedirectToAdmission = () => {
    if (userRole !== 'parent') return false;
    return ['pending', 'in_progress'].includes(admissionStatus || '');
  };

  if (isAuthenticated && shouldRedirectToAdmission()) {
    const isAdmissionRoute = location.pathname.includes('/admission');
    if (!isAdmissionRoute) {
      return <Navigate to="/admission/welcome" replace />;
    }
  }

  return (
    <>
      <Header />
      <Routes isAuthenticated={isAuthenticated} onLoginSuccess={handleLoginSuccess} />
      <Footer />
    </>
  );
};

function App(): React.ReactElement {
  return (
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <LanguageProvider>
          <SnackbarProvider maxSnack={3}>
            <AppContent />
          </SnackbarProvider>
        </LanguageProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
}

export default App;
