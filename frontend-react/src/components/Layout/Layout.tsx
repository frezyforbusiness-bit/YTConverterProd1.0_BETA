import React, { type ReactNode, useEffect } from 'react';
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const faqContext =
    location.pathname.startsWith('/mixmaster')
      ? 'mixmaster_analyzer'
      : 'default';

  return (
    <LayoutContainer>
      <Navbar />
      <MainContent>{children}</MainContent>
      <Footer faqContext={faqContext} />
    </LayoutContainer>
  );
};

