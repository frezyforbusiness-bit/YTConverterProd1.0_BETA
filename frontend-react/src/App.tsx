import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Maintenance } from './views/Maintenance/Maintenance';
import { AuthProvider } from './context/AuthContext';
import './styles/globals.css';
import './styles/animations.css';
import './styles/utilities.css';

const AppContent: React.FC = () => {
  const { theme } = useTheme();

  return (
    <StyledThemeProvider theme={theme}>
      <ErrorBoundary>
        <Routes>
          <Route path="*" element={<Maintenance />} />
        </Routes>
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
