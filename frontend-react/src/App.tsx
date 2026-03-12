import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Converter } from './views/Converter';
import { MixMaster } from './views/MixMaster';
import { MixMasterAnalyzer } from './views/MixMasterAnalyzer';
import { Admin } from './views/Admin';
import { About } from './views/About';
import { NotFound } from './views/NotFound/NotFound';
import { AuthProvider } from './context/AuthContext';
import './styles/globals.css';
import './styles/animations.css';
import './styles/utilities.css';

const AppContent: React.FC = () => {
  const { theme } = useTheme();

  return (
    <StyledThemeProvider theme={theme}>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<Converter />} />
            <Route path="/mixmaster" element={<MixMaster />} />
            <Route path="/mixmaster/analyzer" element={<MixMasterAnalyzer />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
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
