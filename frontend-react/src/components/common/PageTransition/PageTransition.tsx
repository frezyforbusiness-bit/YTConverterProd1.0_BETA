import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, pageTransition } from '../../../utils/animationVariants';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = React.memo(({ children }) => {
  // Disable animations to prevent re-animation on every render
  return <div>{children}</div>;
});

