import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Home } from './views/Home';
import { Converter } from './views/Converter';
import { MixMaster } from './views/MixMaster';
import { Admin } from './views/Admin';
import { UserAuth } from './views/Auth';
import { NotFound } from './views/NotFound/NotFound';
import { AuthProvider } from './context/AuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
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
            <Route path="/" element={<Home />} />
            <Route path="/converter" element={<Converter />} />
            <Route path="/mixmaster" element={<MixMaster />} />
            <Route path="/auth" element={<UserAuth />} />
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
        <UserAuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </UserAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
