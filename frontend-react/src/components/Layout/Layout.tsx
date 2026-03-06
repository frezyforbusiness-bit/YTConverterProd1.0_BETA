import React, { type ReactNode } from 'react';
import styled from 'styled-components';
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
  return (
    <LayoutContainer>
      <Navbar />
      <MainContent>{children}</MainContent>
      <Footer />
    </LayoutContainer>
  );
};

