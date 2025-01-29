import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import LoginPage from './login/LoginPage';
import Dashboard from './childern-dashboard/pages/Dashboard';

function App(): React.ReactElement {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <React.StrictMode>
      <ChakraProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route
                path="/login"
                element={
                  <LoginPage
                    onLoginSuccess={function (token: string): void {
                      throw new Error('Function not implemented.');
                    }}
                  />
                }
              />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Add more authenticated routes here */}
            </Route>

            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
            />
          </Routes>
        </BrowserRouter>
      </ChakraProvider>
    </React.StrictMode>
  );
}

export default App;
