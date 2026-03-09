import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Maintenance } from './views/Maintenance/Maintenance';
import { Home } from './views/Home';
import { Converter } from './views/Converter';
import { MixMaster } from './views/MixMaster';
import { Admin } from './views/Admin';
import { NotFound } from './views/NotFound/NotFound';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/globals.css';
import './styles/animations.css';
import './styles/utilities.css';

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <StyledThemeProvider theme={theme}>
      <ErrorBoundary>
        {isAuthenticated ? (
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/converter" element={<Converter />} />
              <Route path="/mixmaster" element={<MixMaster />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        ) : (
          <Routes>
            <Route path="/" element={<Maintenance />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </ErrorBoundary>
    </StyledThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
