import React, { type ReactNode } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: 80px; /* Navbar height */
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
`;

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const faqContext =
    location.pathname.startsWith('/mixmaster/analyzer') ? 'mixmaster_analyzer' : 'default';

  return (
    <LayoutContainer>
      <Navbar />
      <MainContent>{children}</MainContent>
      <Footer faqContext={faqContext} />
    </LayoutContainer>
  );
};

