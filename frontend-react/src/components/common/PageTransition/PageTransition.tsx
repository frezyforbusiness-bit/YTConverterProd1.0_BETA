import React, { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = React.memo(({ children }) => {
  // Disable animations to prevent re-animation on every render
  return <div>{children}</div>;
});

